# Security Policy

## 报告漏洞

如果你发现了織 / Zhī 的安全漏洞，请通过 [GitHub Security Advisories](https://github.com/LinekForge/zhi/security/advisories/new) 私下报告。

**不要为安全漏洞开公开 issue。**

## 响应时间

- **确认收到**：7 天内
- **初步评估**：14 天内
- **修复或缓解**：确认漏洞后 30 天内

## 范围

織是本地优先的应用——所有数据留在用户自己的机器上。主要关注的安全问题：

- **数据完整性** — 日记条目和 SQLite 数据库不应被损坏或丢失
- **本地访问控制** — 开发服务器默认只绑定 `localhost`，不接受远程访问
- **MCP server** — MCP 接口接受来自连接的 agent 的 tool 调用，需确保没有意外的数据泄露

## 不在范围内

- 需要物理接触用户机器才能触发的漏洞
- 第三方依赖中的问题（请向上游报告，但也欢迎告知我们以便及时更新）
