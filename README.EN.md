# MCP Tool Template

A best-practice template for creating Model-driven Co-programming (MCP) tools.

This template provides a solid foundation for building your own MCP tools, with a focus on best practices, scalability, and ease of use. It includes a basic project structure, a generic MCP server, a process manager to ensure a single instance, and a cross-platform startup script.

## Features

- **TypeScript First**: Code with types for better maintainability.
- **Clear Project Structure**: A logical and easy-to-navigate project layout.
- **Singleton Process**: Includes a process manager to prevent multiple instances from running.
- **Cross-Platform**: Uses a Python wrapper to ensure smooth execution on Windows, macOS, and Linux.
- **Ready-to-use Scripts**: Common scripts for building, development, and starting the application.
- **Extensible by Design**: Comes with a simple "hello" tool to get you started.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Python](https://www.python.org/) (v3.x)
- [pnpm](https://pnpm.io/) (for dependency management)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shuakami/mcp-init.git
    cd mcp-init
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Configure environment variables:**
    Rename `.env.example` to `.env` and customize the variables as needed.

    ```bash
    mv .env.example .env
    ```

## Project Structure

```
.
├── .env.example        # Environment variable template
├── .gitignore          # Files to be ignored by Git
├── package.json        # Project metadata and dependencies
├── pnpm-lock.yaml      # Lockfile for pnpm
├── run_mcp.py          # Cross-platform startup script
├── src/                # Source code
│   ├── index.ts        # Main application entry point
│   ├── mcp.ts          # Core MCP server and tool registration
│   └── process-manager.ts # Handles singleton process logic
└── tsconfig.json       # TypeScript compiler options
```

## How to Use

### Development Mode

To run the application in development mode with hot-reloading:

```bash
pnpm dev
```
This will start the server, and any changes in the `src` directory will automatically restart it.

### Building for Production

To compile the TypeScript code into JavaScript:

```bash
pnpm build
```
The compiled output will be placed in the `dist` directory.

### Running in Production

To start the compiled application:

```bash
pnpm start
```
This command uses the `run_mcp.py` script to launch the Node.js application in a robust way.

## Customizing Your MCP

To create your own MCP tool, you'll primarily be working in the `src/mcp.ts` file.

1.  **Rename `YourMcp`**: Change the `YourMcp` class to something more descriptive for your tool. Remember to update the class name in `src/index.ts` as well.

2.  **Register New Tools**: Add your own tools inside the `registerTools` method. Follow the example of the `hello` tool.

   ```typescript
   // inside src/mcp.ts, in the YourMcp class

   private registerTools(): void {
     // Your new tool
     this.server.tool(
       "yourToolName",
       {
         // Define input parameters using Zod schemas
         param1: z.string().describe("Description for parameter 1."),
         param2: z.number().optional().describe("An optional parameter."),
       },
       async (params) => {
         // Your tool's logic here
         console.log(params.param1);

         // Return a result
         return {
           content: [
             { type: "text", text: `Tool executed successfully!` }
           ]
         };
       }
     );

     // You can register more tools here
   }
   ```

3.  **Add Logic to `close()`**: If your tool needs specific cleanup actions (e.g., closing a database connection), add them to the `close` method in `src/mcp.ts`.

That's it! You are now ready to build powerful MCP tools. 