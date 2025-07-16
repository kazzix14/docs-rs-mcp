import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

export class YourMcp {
  private server: McpServer;

  constructor() {
    // 初始化MCP服务器
    this.server = new McpServer({
      name: "template-mcp",
      version: "1.0.0"
    });

    // 注册工具
    this.registerTools();

    // 连接到标准输入/输出
    const transport = new StdioServerTransport();
    this.server.connect(transport).catch(err => {
      console.error('连接MCP传输错误:', err);
    });
  }

  /**
   * 注册所有MCP工具
   */
  private registerTools(): void {
    this.server.tool(
      "hello",
      {
        name: z.string().optional().describe("The name to say hello to."),
      },
      async ({ name }) => {
        const greeting = process.env.MCP_GREETING || "Hello";
        const target = name || "World";
        
        return {
          content: [
            { type: "text", text: `${greeting}, ${target}!` }
          ]
        };
      }
    );
  }

  /**
   * 关闭所有连接
   */
  async close(): Promise<void> {
    // 在这里添加任何必要的清理逻辑
    console.log("MCP a a aserver has been closed.");
  }
} 