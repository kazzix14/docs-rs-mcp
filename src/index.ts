#!/usr/bin/env node

import { config } from 'dotenv';
import { ProcessManager } from './process-manager.js';
import { YourMcp } from './mcp.js';

// 加载环境变量
config();

// 主函数
async function main() {
  // 创建进程管理器
  const processManager = new ProcessManager();

  // 检查进程互斥
  if (!await processManager.checkAndCreateLock()) {
    console.log('无法创建MCP实例，程序退出');
    process.exit(1);
  }

  // 实例化你的MCP
  const yourMcp = new YourMcp();

  // 处理进程退出
  const shutdown = async () => {
    console.log('正在关闭MCP服务...');
    await yourMcp.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// 启动应用
main().catch(error => {
  console.error('MCP服务启动失败:', error);
  process.exit(1);
}); 