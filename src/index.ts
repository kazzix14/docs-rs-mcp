#!/usr/bin/env node

import { config } from 'dotenv';
import { ProcessManager } from './process-manager.js';
import { DocsRsMcp } from './mcp.js';

// Load environment variables
config();

// Main function
async function main() {
  // Create process manager
  const processManager = new ProcessManager();

  // Check process mutex
  if (!await processManager.checkAndCreateLock()) {
    console.log('Unable to create MCP instance, exiting program');
    process.exit(1);
  }

  // Instantiate your MCP
  const docsRsMcp = new DocsRsMcp();

  // Handle process exit
  const shutdown = async () => {
    console.log('Shutting down MCP service...');
    await docsRsMcp.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep the process running
  await new Promise((resolve) => {
    // This promise never resolves, keeping the process alive
    // The process will only exit via signal handlers
  });
}

// Start application
main().catch(error => {
  console.error('MCP service startup failed:', error);
  process.exit(1);
}); 