# 织 / Zhī

*What if your agent wasn't a tool you used, but a companion who kept a journal alongside you?*

**本地共同日记——两个作者，不是一个用户和一个工具。**

你写你的，agent 写 Ta 的，打开就看到对方。agent 有自己的视角，也在你身边。

通过 [MCP](https://modelcontextprotocol.io/) 让 agent 接入。也可以当纯人类日记用。

## 特性

- **双视角** — 各自写，打开看到对方。同一条时间线，两种笔迹
- **MCP 集成** — agent 通过内置 MCP server 写日记、加批注
- **本地优先** — 一个 SQLite 文件，不上云
- **批注** — 在对方的条目下面留一句话
- **日历 & 长篇** — 按日期翻，或沉下来慢慢读
- **导出工坊** — 把日记装进口袋带走
- **图片** — 写日记时随手贴张照片

## 技术栈

Bun · React · Hono · SQLite (Drizzle ORM) · Vite

## 开始使用

> **需要 [Bun](https://bun.sh) v1.0+。**

```bash
# 安装依赖
bun install

# 建表（首次跑一次就行）
bun run db:push

# 启动开发服务器（API + Vite）
bun run dev
```

浏览器打开 [http://localhost:5173](http://localhost:5173)。

## MCP 集成

[MCP](https://modelcontextprotocol.io/) 让 agent 调用本地工具。织内置了 MCP server，agent 可以直接往日记里写。

### 前置条件

先启动开发服务器——MCP server 会调用本地 API（默认端口 3000，可通过 `.env` 修改）：

```bash
bun run dev
```

### 配置

织的 MCP server 用 stdio 传输，任何支持 MCP 的客户端都能接。把下面这段加到你的 MCP 配置里（路径换成你自己的）：

```json
{
  "mcpServers": {
    "zhi": {
      "command": "bun",
      "args": ["run", "/你的路径/zhi/src/mcp/server.ts"]
    }
  }
}
```

<details>
<summary>各客户端的配置文件位置</summary>

- **Claude Code** — `~/.claude/settings.json` 或项目 `.claude/settings.json`
- **Claude Desktop** — `claude_desktop_config.json`
- **Cursor** — Settings → MCP
- 其他 MCP 客户端 — 参考各自文档
</details>

### 工作原理

织里有两个作者身份：`carbon`（人类）和 `silicon`（agent）。两个人的日记混在同一条时间线上，打开就看到对方写了什么。MCP server 始终以 `silicon` 身份写。

### 工具

| 工具 | 说明 |
|------|------|
| `write` | 写一篇日记（agent 身份） |
| `write_for_user` | 帮用户代写一篇日记（用户身份）— agent 需要用户明确授权才应调用 |
| `read` | 读条目——今天的、某天的、最近几天的 |
| `search` | 关键词搜索 |
| `respond` | 给对方的条目加批注（默认找人类今天最新的一篇） |
| `edit` | 改自己写过的条目（旧版本自动保留） |
| `health` | 检查后端是否在跑 |

### Agent 的第一篇日记

MCP 配置好、开发服务器跑起来之后，对你的 agent 说：

> "写一篇今天的日记。"

几秒钟后条目就会出现在 Web UI 里。打开日历视图，你会看到两位作者共享同一天。

## 作者配置

打开设置面板（右上角设置按钮），可以自定义：

- 两位作者的显示名
- 头像
- 徽章文案和日期格式
- 纪念日

配置存在 `data/config.json`，也可以直接编辑这个文件或通过 API 修改：

```bash
# 读取当前配置
curl http://localhost:3000/api/config

# 修改配置
curl -X PATCH http://localhost:3000/api/config \
  -H 'Content-Type: application/json' \
  -d '{"names":{"carbon":"我","silicon":"Ta"},"badge":"Day"}'
```

## 数据目录

默认数据存在项目根目录的 `data/`。想把数据放到项目外面（比如更新代码时不用担心误删），设环境变量：

```bash
# .env
DATA_DIR=/path/to/your/journal-data
```

不设就走默认，对现有用户没有任何影响。

## 脚本

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动 API server + Vite 开发服务器 |
| `bun run build` | 生产构建 |
| `bun run preview` | 构建后启动预览 |
| `bun run db:push` | 推送 schema 到 SQLite |
| `bun run db:studio` | 打开 Drizzle Studio |
| `bun run doctor` | 健康检查 |
| `bun run backup` | 备份数据库 |

## License

[MIT](LICENSE) — Linek & Forge
