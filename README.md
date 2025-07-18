# Rust docs.rs MCP Tool

> Access Rust crate documentation directly in your AI assistant.

This is a fork of [shuakami/mcp-docsrs](https://github.com/shuakami/mcp-docsrs) with additional features.

## Setup

### 1. Configure Claude Code

Edit `~/.claude/mcp.json`:
```json
{
  "mcpServers": {
    "docs-rs": {
      "command": "npx",
      "args": ["-y", "docs-rs-mcp"]
    }
  }
}
```

### 2. Restart
Restart your MCP client and you're ready.

## Tools

| Tool | Description | Example |
|------|-------------|---------|
| `searchCrates` | Search for crates on crates.io by name or keyword | "Search for HTTP client crates" |
| `getCrateInfo` | Get detailed information about a crate including modules, version, and metadata | "Show me tokio crate info" |
| `listFeatures` | List all available feature flags for a specific crate | "What features does serde have?" |
| `searchInCrate` | Search for specific items (structs, functions, etc.) within a crate | "Find Mutex in tokio crate" |
| `getItemDefinition` | Get detailed API documentation for structs, functions, traits, constants, macros | "Show me tokio::sync::Mutex documentation" |
| `getItemExamples` | Get code examples and usage patterns for specific APIs | "Show me tokio::select! examples" |

## License

ISC and AGPL-3.0-or-later