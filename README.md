# MCP 工具模板

一个用于创建模型驱动的协同编程 (MCP) 工具的最佳实践模板。

该模板为您构建自己的 MCP 工具提供了一个坚实的基础，重点关注最佳实践、可扩展性和易用性。它包括基本的项目结构、通用的 MCP 服务器、确保单例运行的进程管理器以及跨平台的启动脚本。

> [点击查看英文版文档 (Click for English README)](./README.EN.md)

## 特性

- **TypeScript 优先**: 使用类型进行编码，以获得更好的可维护性。
- **清晰的项目结构**: 逻辑清晰且易于导航的项目布局。
- **单例进程**: 包含一个进程管理器，以防止运行多个实例。
- **跨平台**: 使用 Python 包装器确保在 Windows、macOS 和 Linux 上顺利执行。
- **开箱即用的脚本**: 用于构建、开发和启动应用程序的通用脚本。
- **为扩展而设计**: 带有一个简单的 "hello" 工具，帮助您入门。

## 开始使用

### 环境准备

- [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)
- [Python](https://www.python.org/) (v3.x)
- [pnpm](https://pnpm.io/) (用于依赖管理)

### 安装与设置

1.  **克隆仓库:**
    ```bash
    git clone https://github.com/shuakami/mcp-init.git
    cd mcp-init
    ```

2.  **安装依赖:**
    ```bash
    pnpm install
    ```

3.  **配置环境变量:**
    将 `.env.example` 重命名为 `.env` 并根据需要自定义变量。

    ```bash
    mv .env.example .env
    ```

## 项目结构

```
.
├── .env.example        # 环境变量模板
├── .gitignore          # Git 忽略文件配置
├── package.json        # 项目元数据和依赖
├── pnpm-lock.yaml      # pnpm 锁文件
├── run_mcp.py          # 跨平台启动脚本
├── src/                # 源代码
│   ├── index.ts        # 主程序入口
│   ├── mcp.ts          # 核心 MCP 服务器和工具注册
│   └── process-manager.ts # 处理单例进程逻辑
├── tsconfig.json       # TypeScript 编译器配置
├── README.md           # 中文说明文档
└── README.EN.md        # 英文说明文档
```

## 如何使用

### 开发模式

要在具有热重载的开发模式下运行应用程序：

```bash
pnpm dev
```
这将启动服务器，`src` 目录中的任何更改都将自动重启它。

### 构建生产版本

要将 TypeScript 代码编译为 JavaScript：

```bash
pnpm build
```
编译后的输出将放在 `dist` 目录中。

### 运行生产版本

要启动已编译的应用程序：

```bash
pnpm start
```
此命令使用 `run_mcp.py` 脚本以健壮的方式启动 Node.js 应用程序。

## 自定义您的 MCP

要创建您自己的 MCP 工具，您将主要在 `src/mcp.ts` 文件中工作。

1.  **重命名 `YourMcp`**: 将 `YourMcp` 类更改为对您的工具更具描述性的名称。请记住也要在 `src/index.ts` 中更新类名。

2.  **注册新工具**: 在 `registerTools` 方法中添加您自己的工具。遵循 `hello` 工具的示例。

   ```typescript
   // 在 src/mcp.ts 的 YourMcp 类中

   private registerTools(): void {
     // 您的新工具
     this.server.tool(
       "yourToolName",
       {
         // 使用 Zod schema 定义输入参数
         param1: z.string().describe("参数1的描述."),
         param2: z.number().optional().describe("一个可选参数."),
       },
       async (params) => {
         // 您工具的逻辑代码
         console.log(params.param1);

         // 返回结果
         return {
           content: [
             { type: "text", text: `工具执行成功!` }
           ]
         };
       }
     );

     // 您可以在这里注册更多工具
   }
   ```

3.  **向 `close()` 添加逻辑**: 如果您的工具需要特定的清理操作（例如，关闭数据库连接），请将它们添加到 `src/mcp.ts` 的 `close` 方法中。

就是这样！您现在已准备好构建强大的 MCP 工具。 