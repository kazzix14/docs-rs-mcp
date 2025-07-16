# Docs.rs MCP 工具

[![ISC License](https://img.shields.io/badge/License-ISC-9f7aea?style=flat-square)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-38a169?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-2b6cb0?style=flat-square)](https://www.typescriptlang.org/)
[![Docs.rs](https://img.shields.io/badge/Docs.rs-MCP-ff69b4?style=flat-square)](https://github.com/shuakami/mcp-docsrs)
[![smithery badge](https://smithery.ai/badge/@shuakami/mcp-docsrs)](https://smithery.ai/server/@shuakami/mcp-docsrs)

[English Version (README-EN.md)](README-EN.md)

## 这是什么

这是一个基于 MCP (Model Context Protocol) 的 Docs.rs 工具，它能让 AI 模型在不离开开发环境的情况下，深度访问 Rust Crate 的文档。

简单来说，它让 AI 助手能够成为一个专业的 Rust 开发伙伴，帮助你执行各种文档查询操作，如搜索 crate、检查 API 定义、查看功能标志、获取代码示例等，从而极大地提升了编码和学习效率。

<details>
<summary><b>支持的功能</b> (点击展开)</summary>

- **Crate 搜索**: 在 crates.io 上按名称搜索 crate。
- **Crate 信息查询**: 获取特定 crate 的元数据、模块列表和最新版本信息。
- **Feature Flag 列表**: 展示一个 crate 所有的可用功能标志 (feature flags)。
- **Crate 内全局搜索**: 在指定 crate 的所有文档中进行高效的全文搜索。
- **全面的 API 定义查看**: 不仅能获取函数、结构体的定义，还完美支持对**宏**、**复杂类型别名**、**FFI 类型**以及**标准库** (`std`, `core`, `alloc`) 的查询。
- **准确的代码示例获取**: 查找并展示特定 API 的使用示例，同样支持标准库。
</details>

<details>
<summary><b>功能特点</b> (点击展开)</summary>

以下是 Docs.rs MCP 工具的一些核心特点：

- **沉浸式文档体验**：所有操作都在编辑器内完成，无需跳转浏览器，保持开发流程的连贯性。
- **高效的内部搜索与查找**: 通过在内存中解析 `all.html` 构建搜索索引，实现了对 crate 内部文档的快速、准确的全局搜索，并能**完美处理类型别名、重导出等复杂情况**。
- **广泛的兼容性**: 经过大量测试，确保了对 docs.rs 上绝大多数库的稳定支持，包括对标准库的特殊适配。
- **智能缓存机制**：对 API 请求和解析后的数据进行缓存，显著提升重复查询的速度。
- **分页支持**：对于模块、搜索结果等长列表，支持分页浏览，避免信息过载。
- **Markdown 格式化输出**：将原始的 HTML 文档转换为格式优美的 Markdown，**提升了代码片段和文档的可读性**。
- **稳定可靠**：通过直接与 crates.io 和 docs.rs 交互，确保获取的信息是最新的官方文档。

通过简单的自然语言指令，AI 可以帮助你完成上述所有操作，成为你学习和使用 Rust 生态库的得力助手。
</details>

## 快速上手

### 0. 环境准备

<details>
<summary>如果你之前没有使用过 Node.js (点击展开)</summary>

1. 安装 Node.js 和 npm
   - 访问 [Node.js 官网](https://nodejs.org/)
   - 下载并安装 LTS（长期支持）版本（推荐 18.x 或更高版本）
   - 安装时选择默认选项即可，安装包会同时安装 Node.js 和 npm

2. 安装 pnpm（推荐）
   - 本项目使用 pnpm 进行包管理，它能更高效地管理依赖。
   - 打开命令提示符（CMD）或 PowerShell，输入以下命令进行安装：
     ```bash
     npm install -g pnpm
     ```

3. 验证安装
   - 安装完成后，打开新的终端窗口
   - 输入以下命令确认安装成功：
     ```bash
     node --version
     pnpm --version
     ```
   - 如果显示版本号，则表示安装成功

4. 安装 Git（如果尚未安装）
   - 访问 [Git 官网](https://git-scm.com/)
   - 下载并安装 Git
   - 安装时使用默认选项即可
</details>


### 1. 克隆并安装

```bash
git clone https://github.com/shuakami/mcp-docsrs.git
cd mcp-docsrs
pnpm install
```

### 2. 构建项目

```bash
pnpm build
```

### 3. 添加到 Cursor MCP 配置

根据你的操作系统，按照以下步骤配置 MCP：

<details>
<summary><b>Windows 配置</b> (点击展开)</summary>

1. 在 Cursor 中，打开或创建 MCP 配置文件：`C:\\Users\\你的用户名\\.cursor\\mcp.json`
   - 注意：请将 `你的用户名` 替换为你的 Windows 用户名

2. 添加或修改配置如下：

```json
{
  "mcpServers": {
    "docsrs-mcp": {
      "command": "pythonw",
      "args": [
        "run_mcp.py"
      ],
      "cwd": "C:/Users/你的用户名/mcp-docsrs"
    }
  }
}
```

> ⚠️ **请注意**:
> - 将 `你的用户名` 替换为你的 Windows 用户名
> - 确保 `cwd` 路径正确指向你克隆的项目目录
> - **不要删除克隆的文件夹**，这会导致 MCP 无法正常工作
</details>

<details>
<summary><b>macOS 配置</b> (点击展开)</summary>

1. 在 Cursor 中，打开或创建 MCP 配置文件：`/Users/你的用户名/.cursor/mcp.json`
   - 注意：请将 `你的用户名` 替换为你的 macOS 用户名

2. 添加或修改配置如下：

```json
{
  "mcpServers": {
    "docsrs-mcp": {
      "command": "python",
      "args": [
        "run_mcp.py"
      ],
      "cwd": "/Users/你的用户名/mcp-docsrs"
    }
  }
}
```

> ⚠️ **请注意**:
> - 将 `你的用户名` 替换为你的 macOS 用户名
> - 确保 `cwd` 路径正确指向你克隆的项目目录
> - **不要删除克隆的文件夹**，这会导致 MCP 无法正常工作
</details>

<details>
<summary><b>Linux 配置</b> (点击展开)</summary>

1. 在 Cursor 中，打开或创建 MCP 配置文件：`/home/你的用户名/.cursor/mcp.json`
   - 注意：请将 `你的用户名` 替换为你的 Linux 用户名

2. 添加或修改配置如下：

```json
{
  "mcpServers": {
    "docsrs-mcp": {
      "command": "python",
      "args": [
        "run_mcp.py"
      ],
      "cwd": "/home/你的用户名/mcp-docsrs"
    }
  }
}
```

> ⚠️ **请注意**:
> - 将 `你的用户名` 替换为你的 Linux 用户名
> - 确保 `cwd` 路径正确指向你克隆的项目目录
> - **不要删除克隆的文件夹**，这会导致 MCP 无法正常工作
</details>

### 4. 启动服务

配置好之后，重启 Cursor 编辑器，它会自动启动 MCP 服务。然后你就可以开始使用了。

<details>
<summary>使用示例 (点击展开)</summary>

你可以要求 AI 执行以下操作：
- "帮我搜索一个叫 `tokio` 的 Rust crate"
- "看看 `tokio` 这个 crate 的信息和模块列表"
- "列出 `serde` 这个 crate 的所有 feature flags"
- "在 `russh` crate 的文档里搜索 `server`"
- "给我看看 `tokio::sync::Mutex` 的 API 文档"
- "有 `tokio::fs::File` 的使用例子吗？"
</details>

## 工作原理

<details>
<summary>技术实现细节 (点击展开)</summary>

本工具基于 **MCP (Model Context Protocol)** 标准实现，作为 AI 模型与 Docs.rs 服务之间的桥梁。它通过模拟浏览器行为来获取和解析文档数据。

主要技术组件包括：
- **HTTP 客户端**: 使用 **axios** 发送网络请求到 `crates.io` 和 `docs.rs`。
- **HTML 解析器**: 使用 **cheerio** 在服务器端解析返回的 HTML 文档，提取所需信息。
- **数据校验**: 使用 **Zod** 对工具的输入参数进行严格的类型校验和验证。
- **内存搜索引擎**: 对于“Crate 内搜索”功能，工具会下载目标 crate 的 `all.html` 文件，在内存中解析并构建一个可供搜索的条目索引，以实现高效的即时搜索。
- **缓存层**: 实现了一个可配置的内存缓存（默认10分钟），用于缓存网络请求和解析结果，避免对同一资源进行重复请求，提升响应速度。
- **Markdown 转换**: 使用 **turndown** 将解析出的 HTML 内容转换为 AI 更易于理解和呈现的 Markdown 格式。
</details>

## 许可证

ISC

---

如果这个项目对你有帮助，欢迎给个 Star ⭐️ (｡♥‿♥｡)

