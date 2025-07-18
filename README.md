# Docs.rs MCP Tool

[![ISC License](https://img.shields.io/badge/License-ISC-9f7aea?style=flat-square)](https://opensource.org/licenses/ISC)
[![AGPL License](https://img.shields.io/badge/License-AGPL%20v3-007EC6?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-38a169?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-2b6cb0?style=flat-square)](https://www.typescriptlang.org/)
[![Docs.rs](https://img.shields.io/badge/Docs.rs-MCP-ff69b4?style=flat-square)](https://github.com/shuakami/mcp-docsrs)

[中文版本 (README-CN.md)](README-CN.md)

## What is this?

This is a Docs.rs tool based on the MCP (Model Context Protocol), enabling AI models to deeply access Rust Crate documentation without leaving the development environment.

In simple terms, it allows your AI assistant to become a professional Rust development partner, helping you perform various documentation queries such as searching for crates, checking API definitions, viewing feature flags, and getting code examples. This greatly enhances coding and learning efficiency.

<details>
<summary><b>Supported Features</b> (Click to expand)</summary>

- **Crate Search**: Search for crates by name on crates.io.
- **Crate Info**: Get metadata, module lists, and the latest version information for a specific crate.
- **List Feature Flags**: Display all available feature flags for a crate.
- **Global Search within a Crate**: Perform efficient full-text search across all documentation for a specific crate.
- **Comprehensive API Definition Lookup**: Get detailed definitions and documentation not only for functions and structs, but also with full support for **macros**, **complex type aliases**, **FFI types**, and the **standard library** (`std`, `core`, `alloc`).
- **Accurate Code Example Retrieval**: Find and display usage examples for a specific API, with support for the standard library as well.
</details>

<details>
<summary><b>Key Features</b> (Click to expand)</summary>

Here are some of the core features of the Docs.rs MCP Tool:

- **Immersive Documentation Experience**: All operations are completed within the editor, eliminating the need to switch to a browser and maintaining a seamless development workflow.
- **Efficient Internal Search and Lookup**: Achieves fast and accurate full-text search and lookups within a crate's documentation by building an in-memory search index from `all.html`, **flawlessly handling type aliases, re-exports, and other complex cases**.
- **Broad Compatibility**: Extensively tested to ensure stable support for the vast majority of libraries on docs.rs, including special handling for the standard library.
- **Smart Caching Mechanism**: Caches API requests and parsed data to significantly speed up repeated queries.
- **Pagination Support**: Supports paginated browsing for long lists like modules and search results to avoid information overload.
- **Markdown Formatted Output**: Converts raw HTML documentation into beautifully formatted Markdown, **improving the readability of code snippets and documentation**.
- **Stable and Reliable**: Ensures the information is up-to-date by interacting directly with the official crates.io and docs.rs services.

With simple natural language instructions, your AI can perform all the above operations, becoming a powerful assistant for learning and using the Rust ecosystem libraries.
</details>

## Getting Started

### 0. Prerequisites

<details>
<summary>If you are new to Node.js (Click to expand)</summary>

1.  Install Node.js and npm
    -   Visit the [Node.js official website](https://nodejs.org/).
    -   Download and install the LTS (Long-Term Support) version (18.x or higher recommended).
    -   Use the default options during installation, which will install both Node.js and npm.

2.  Install pnpm (recommended)
    -   This project uses pnpm for package management, which handles dependencies more efficiently.
    -   Open Command Prompt (CMD) or PowerShell and run the following command to install it:
        ```bash
        npm install -g pnpm
        ```

3.  Verify Installation
    -   After installation, open a new terminal window.
    -   Enter the following commands to confirm success:
        ```bash
        node --version
        pnpm --version
        ```
    -   If version numbers are displayed, the installation was successful.

4.  Install Git (if not already installed)
    -   Visit the [Git official website](https://git-scm.com/).
    -   Download and install Git.
    -   Use the default options during installation.
</details>

### 1. Clone and Install

```bash
git clone https://github.com/shuakami/mcp-docsrs.git
cd mcp-docsrs
pnpm install
```

### 2. Build the Project

```bash
pnpm build
```

### 3. Add to Cursor MCP Configuration

Follow the steps below to configure MCP based on your operating system:

<details>
<summary><b>Windows Configuration</b> (Click to expand)</summary>

1.  In Cursor, open or create the MCP configuration file: `C:\\Users\\YourUsername\\.cursor\\mcp.json`
    -   Note: Replace `YourUsername` with your actual Windows username.

2.  Add or modify the configuration as follows:

```json
{
  "mcpServers": {
    "docsrs-mcp": {
      "command": "npm",
      "args": [
        "run",
        "start"
      ],
      "cwd": "C:/Users/YourUsername/mcp-docsrs"
    }
  }
}
```

> ⚠️ **Please Note**:
> - Replace `YourUsername` with your Windows username.
> - Ensure the `cwd` path correctly points to the directory where you cloned the project.
> - **Do not delete the cloned folder**, as this will prevent the MCP from working correctly.
</details>

<details>
<summary><b>macOS Configuration</b> (Click to expand)</summary>

1.  In Cursor, open or create the MCP configuration file: `/Users/YourUsername/.cursor/mcp.json`
    -   Note: Replace `YourUsername` with your actual macOS username.

2.  Add or modify the configuration as follows:

```json
{
  "mcpServers": {
    "docsrs-mcp": {
      "command": "npm",
      "args": [
        "run",
        "start"
      ],
      "cwd": "/Users/YourUsername/mcp-docsrs"
    }
  }
}
```

> ⚠️ **Please Note**:
> - Replace `YourUsername` with your macOS username.
> - Ensure the `cwd` path correctly points to the directory where you cloned the project.
> - **Do not delete the cloned folder**, as this will prevent the MCP from working correctly.
</details>

<details>
<summary><b>Linux Configuration</b> (Click to expand)</summary>

1.  In Cursor, open or create the MCP configuration file: `/home/YourUsername/.cursor/mcp.json`
    -   Note: Replace `YourUsername` with your actual Linux username.

2.  Add or modify the configuration as follows:

```json
{
  "mcpServers": {
    "docsrs-mcp": {
      "command": "npm",
      "args": [
        "run",
        "start"
      ],
      "cwd": "/home/YourUsername/mcp-docsrs"
    }
  }
}
```

> ⚠️ **Please Note**:
> - Replace `YourUsername` with your Linux username.
> - Ensure the `cwd` path correctly points to the directory where you cloned the project.
> - **Do not delete the cloned folder**, as this will prevent the MCP from working correctly.
</details>

### 4. Start the Service

After configuring, restart the Cursor editor, and it will automatically start the MCP service. You can then begin using it.

<details>
<summary>Usage Examples (Click to expand)</summary>

You can ask the AI to perform the following actions:
- "Help me search for a Rust crate called `tokio`"
- "Show me the info and module list for the `tokio` crate"
- "List all feature flags for the `serde` crate"
- "Search for `server` in the `russh` crate's documentation"
- "Show me the API docs for `tokio::sync::Mutex`"
- "Are there any usage examples for `tokio::fs::File`?"
</details>

## How It Works

<details>
<summary>Technical Implementation Details (Click to expand)</summary>

This tool is implemented based on the **MCP (Model Context Protocol)** standard, acting as a bridge between the AI model and the Docs.rs service. It fetches and parses documentation data by simulating browser behavior.

The main technical components include:
- **HTTP Client**: Uses **axios** to send network requests to `crates.io` and `docs.rs`.
- **HTML Parser**: Uses **cheerio** to parse the returned HTML documents on the server-side and extract the required information.
- **Data Validation**: Uses **Zod** for strict type checking and validation of tool input parameters.
- **In-Memory Search Engine**: For the "Search within Crate" feature, the tool downloads the target crate's `all.html` file, parses it in memory, and builds a searchable index of items to enable efficient, real-time searching.
- **Caching Layer**: Implements a configurable in-memory cache (defaulting to 10 minutes) for network requests and parsed results to avoid redundant requests for the same resource and improve response speed.
- **Markdown Conversion**: Uses **turndown** to convert the parsed HTML content into a Markdown format that is easier for the AI to understand and present.
</details>

## License

This project is licensed under both the ISC License and the GNU Affero General Public License v3.0 or later (AGPLv3+). You must comply with the terms of both licenses.

See the [LICENSE](LICENSE) file for full license text.

---

If you find this project helpful, please give it a Star ⭐️ (｡♥‿♥｡) 