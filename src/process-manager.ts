import * as fs from 'fs';
import * as path from 'path';

// Lock file path configuration
const LOCK_FILE = path.join(process.cwd(), '.mcp-docs-rs.lock');

export class ProcessManager {
  private instanceId: string;

  constructor() {
    // Generate unique instance ID
    this.instanceId = Date.now().toString();
    
    // Register process exit handling
    this.registerCleanup();
  }

  private registerCleanup(): void {
    // Register multiple signals to ensure cleanup
    const cleanup = () => this.cleanup();
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }

  private cleanup(): void {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
        // Only clean up own lock file
        if (lockData.instanceId === this.instanceId) {
          fs.unlinkSync(LOCK_FILE);
          // Process lock file cleaned up
        }
      }
    } catch (error) {
      // Handle errors silently here, as cleanup failures should not cause program crash
    }
  }

  private async waitForProcessExit(pid: number, timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        process.kill(pid, 0);
        // Process is still running, wait 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        // Process has exited
        return true;
      }
    }
    return false;
  }

  public async checkAndCreateLock(): Promise<boolean> {
    try {
      // Check if lock file exists
      if (fs.existsSync(LOCK_FILE)) {
        const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
        
        try {
          // Check if process is still running
          process.kill(lockData.pid, 0);
          console.error('Detected existing MCP instance running, attempting to terminate old instance...');
          // Send termination signal
          process.kill(lockData.pid, 'SIGTERM');
          
          // Wait for old process to exit
          const exited = await this.waitForProcessExit(lockData.pid);
          if (!exited) {
            console.error('Timeout waiting for old instance to exit, please manually check and terminate process (PID: ' + lockData.pid + ')');
            return false;
          }
          // Old instance has exited
          
          // Delete old lock file
          fs.unlinkSync(LOCK_FILE);
        } catch (e) {
          // Process doesn't exist, it's an expired lock file
          // Detected expired lock file, will overwrite directly
          fs.unlinkSync(LOCK_FILE);
        }
      }

      // Create new lock file
      fs.writeFileSync(LOCK_FILE, JSON.stringify({
        pid: process.pid,
        instanceId: this.instanceId,
        timestamp: Date.now()
      }));

      // MCP instance lock file created
      return true;
    } catch (error) {
      console.error('Error handling lock file:', error);
      return false;
    }
  }
} 