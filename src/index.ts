#!/usr/bin/env node

import { config } from 'dotenv';
import { DocsRsMcp } from './mcp.js';

// Load environment variables
config();

// Main function
async function main() {
  // Instantiate your MCP
  const docsRsMcp = new DocsRsMcp();

  // Handle process exit
  const shutdown = async () => {
    await docsRsMcp.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[FATAL] Uncaught exception:', error);
    shutdown();
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled rejection at:', promise, 'reason:', reason);
    shutdown();
  });
  
  // Keep the process running
  await new Promise((resolve) => {
    // This promise never resolves, keeping the process alive
    // The process will only exit via signal handlers
  });
}

// Start application
main().catch(error => {
  console.error('[FATAL] MCP service startup failed:', error);
  console.error('[FATAL] Stack trace:', error.stack);
  process.exit(1);
}); 