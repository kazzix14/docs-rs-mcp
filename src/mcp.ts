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
      console.error('[ERROR] MCP transport connection error:', err);
      process.exit(1);
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
        page: z.number().int().positive().optional().describe("The page number of methods to display (10 methods per page)."),
      },
      async ({ itemPath, page = 1 }) => {
        try {
          const def = await this.api.scrapeItemDefinition(itemPath);
          
          // Build the response text
          let responseText = `**Item Type:** ${def.itemType}\n\n`;
          
          // Add definition if available
          if (def.definition) {
            responseText += `**Definition:**\n\`\`\`rust\n${def.definition}\n\`\`\`\n\n`;
          }
          
          // Add fields if any
          if (def.fields.length > 0) {
            responseText += `**Fields:** (${def.fields.length} total)\n`;
            def.fields.forEach(field => {
              responseText += `- \`${field.name}\``;
              if (field.type) {
                responseText += `: ${field.type}`;
              }
              if (field.docs) {
                responseText += ` - ${field.docs}`;
              }
              responseText += '\n';
            });
            responseText += '\n';
          }
          
          // Add methods with pagination
          if (def.methods.length > 0) {
            const methodsPerPage = 10;
            const totalPages = Math.ceil(def.methods.length / methodsPerPage);
            
            if (page > totalPages) {
              return { content: [{ type: "text", text: `Invalid page number. Only ${totalPages} pages of methods available for "${itemPath}".` }] };
            }
            
            const startIdx = (page - 1) * methodsPerPage;
            const endIdx = Math.min(startIdx + methodsPerPage, def.methods.length);
            const methodsSlice = def.methods.slice(startIdx, endIdx);
            
            responseText += `**Methods:** (showing ${startIdx + 1}-${endIdx} of ${def.methods.length} total)\n\n`;
            
            methodsSlice.forEach((method, idx) => {
              responseText += `${startIdx + idx + 1}. **${method.name}**\n`;
              responseText += `   \`\`\`rust\n   ${method.signature}\n   \`\`\`\n`;
              if (method.docs) {
                responseText += `   ${method.docs}\n`;
              }
              responseText += '\n';
            });
            
            if (totalPages > 1) {
              responseText += `\n--- Page ${page} of ${totalPages} (${methodsPerPage} methods/page) ---\n`;
              responseText += `Use the 'page' parameter to see more methods.`;
            }
          }
          
          // Add documentation preview (first 1000 chars)
          if (def.documentation && def.documentation !== 'No documentation found.') {
            responseText += `\n**Documentation:**\n${def.documentation.substring(0, 1000)}`;
            if (def.documentation.length > 1000) {
              responseText += '...';
            }
            responseText += '\n';
          }
          
          // Add examples count
          if (def.examples.length > 0) {
            responseText += `\n**Examples:** ${def.examples.length} available (use getItemExamples to view)`;
          }

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
    // MCP server has been closed.
  }
} 