import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DocsRsApi } from './docsRsApi.js';
import { htmlToText } from 'html-to-text';

export class DocsRsMcp {
  private server: McpServer;
  private api: DocsRsApi;

  constructor() {
    this.server = new McpServer({
      name: "docsrs-mcp",
      version: "1.0.0"
    });
    this.api = new DocsRsApi();
    this.registerTools();
    const transport = new StdioServerTransport();
    this.server.connect(transport).catch(err => {
      console.error('MCP transport connection error:', err);
    });
  }

  private registerTools(): void {
    this.server.tool(
      "searchCrates",
      {
        query: z.string().describe("The query to search for crates."),
        page: z.number().int().positive().optional().describe("The page number of results to return."),
      },
      async ({ query, page = 1 }) => {
        try {
          const searchResult = await this.api.searchCrates(query, page);
          const { crates, meta } = searchResult;

          if (crates.length === 0) {
            return { content: [{ type: "text", text: `No crates found for "${query}".` }] };
          }

          const results = crates.map(crate => 
            `**${crate.name}**\n${crate.description || 'No description available.'}`
          ).join('\n\n---\n\n');
          
          const perPage = 5;
          const totalPages = Math.ceil(meta.total / perPage);

          const footer = `\n\nPage ${page} of ${totalPages} (${meta.total} total crates). Use the 'page' parameter to see more results.`;

          return { content: [{ type: "text", text: `Found crates:\n\n${results}${footer}` }] };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          return { content: [{ type: "text", text: `An error occurred: ${errorMessage}` }] };
        }
      }
    );

    this.server.tool(
      "getCrateInfo",
      {
        crateName: z.string().describe("The exact name of the crate to get information for."),
      },
      async ({ crateName }) => {
        try {
          const info = await this.api.scrapeCrateInfo(crateName);
          let responseText = `**Description:** ${info.description}\n\n**Modules:**\n`;
          if (info.modules.length > 0) {
            responseText += info.modules.map(m => `- \`${m}\``).join('\n');
          } else {
            responseText += '_No top-level modules found._';
          }
          return { content: [{ type: "text", text: responseText }] };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          return { content: [{ type: "text", text: `An error occurred while fetching info for "${crateName}": ${errorMessage}` }] };
        }
      }
    );

    this.server.tool(
      "listFeatures",
      {
        crateName: z.string().describe("The exact name of the crate to list features for."),
      },
      async ({ crateName }) => {
        try {
          const features = await this.api.scrapeCrateFeatures(crateName);
          if (features.length === 0) {
            return { content: [{ type: "text", text: `No features found for "${crateName}".` }] };
          }
          const results = features.map(feat => 
            `- **${feat.name}**: ${feat.description}`
          ).join('\n');
          return { content: [{ type: "text", text: `**Features for ${crateName}:**\n\n${results}` }] };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          return { content: [{ type: "text", text: `An error occurred while fetching features for "${crateName}": ${errorMessage}` }] };
        }
      }
    );

    this.server.tool(
      "getItemDefinition",
      {
        itemPath: z.string().describe("The full path to the item (e.g., tokio::sync::Mutex)."),
        page: z.number().int().positive().optional().describe("The page number of the documentation to display."),
      },
      async ({ itemPath, page = 1 }) => {
        try {
          const def = await this.api.scrapeItemDefinition(itemPath);
          let rawDocText: string;

          try {
            rawDocText = htmlToText(def.docHtml, {
              wordwrap: 120,
              selectors: [
                  { selector: 'a', options: { ignoreHref: true } },
                  { selector: 'img', format: 'skip' },
                  { selector: 'h1', options: { uppercase: false, prefix: '# ' } },
                  { selector: 'h2', options: { uppercase: false, prefix: '## ' } },
                  { selector: 'h3', options: { uppercase: false, prefix: '### ' } },
                  { selector: 'pre', format: 'rustBlock' },
              ]
            });
          } catch (formatError) {
            console.error("Markdown formatting failed, falling back to raw HTML.", formatError);
            rawDocText = `[Warning: Markdown formatting failed. Displaying raw content.]\n\n${def.docHtml}`;
          }
          
          const charsPerPage = 6000;
          const totalPages = Math.ceil(rawDocText.length / charsPerPage);

          if (page > totalPages) {
            return { content: [{ type: "text", text: `Invalid page number. Only ${totalPages} pages found for "${itemPath}" documentation.` }] };
          }
          
          const startChar = (page - 1) * charsPerPage;
          const endChar = startChar + charsPerPage;
          const pageContent = rawDocText.substring(startChar, endChar);

          const footer = `\n\n--- Page ${page} of ${totalPages} (approx. 6000 chars/page) ---`;
          const responseText = `**Item Type:** ${def.itemType}\n\n**Documentation:**\n\n${pageContent}${footer}`;

          return { content: [{ type: "text", text: responseText }] };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          return { content: [{ type: "text", text: `An error occurred while fetching definition for "${itemPath}": ${errorMessage}` }] };
        }
      }
    );

    this.server.tool(
      "getItemExamples",
      {
        itemPath: z.string().describe("The full path to the item (e.g., tokio::sync::Mutex)."),
        exampleNumber: z.number().int().positive().optional().describe("The specific example number to display."),
      },
      async ({ itemPath, exampleNumber = 1 }) => {
        try {
          const examples = await this.api.scrapeItemExamples(itemPath);
          if (examples.length === 0) {
            return { content: [{ type: "text", text: `No examples found for "${itemPath}".` }] };
          }
          
          if (exampleNumber > examples.length) {
            return { content: [{ type: "text", text: `Invalid example number. Only ${examples.length} examples found for "${itemPath}".` }] };
          }

          const example = "```rust\n" + examples[exampleNumber - 1] + "\n```";
          const footer = `\n\nExample ${exampleNumber} of ${examples.length}. Use 'exampleNumber' to see other examples.`;

          return { content: [{ type: "text", text: `${example}${footer}` }] };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          return { content: [{ type: "text", text: `An error occurred while fetching examples for "${itemPath}": ${errorMessage}` }] };
        }
      }
    );

    this.server.tool(
      "searchInCrate",
      {
        crateName: z.string().describe("The name of the crate to search within."),
        query: z.string().describe("The item to search for inside the crate."),
      },
      async ({ crateName, query }) => {
        try {
          const results = await this.api.searchInCrate(crateName, query);
          if (results.length === 0) {
            return { content: [{ type: "text", text: `No items found for "${query}" in crate "${crateName}".` }] };
          }
          
          const formattedResults = results.map(r => 
            `- [${r.type}] **${r.name}**`
          ).join('\n');

          const responseText = `Found ${results.length} matches for "${query}" in **${crateName}**:\n\n${formattedResults}`;
          return { content: [{ type: "text", text: responseText }] };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          return { content: [{ type: "text", text: `An error occurred during search in "${crateName}": ${errorMessage}` }] };
        }
      }
    );
  }

  async close(): Promise<void> {
    console.log("MCP server has been closed.");
  }
} 