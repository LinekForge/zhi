# 参与贡献 · 織 / Zhī

谢谢想 contribute！

## 本地搭建

```bash
git clone https://github.com/LinekForge/zhi.git
cd zhi
bun install
bun run db:push
bun run dev
```

打开 [http://localhost:5173](http://localhost:5173) 确认一切正常。

跑一下健康检查，确认环境没问题：

```bash
bun run doctor
```

## 提交改动

1. Fork 仓库，从 `main` 拉一个分支
2. 做改动
3. 本地测试——至少跑一遍 `bun run doctor`，浏览器里看看 UI
4. 开 pull request，写清楚改了什么、为什么改

## 代码风格

- 服务端用 TypeScript，客户端用 JSX
- 暂时没有强制 linter——和现有风格保持一致就行
- commit 保持聚焦、描述清楚

## 报告 Bug

开一个 [GitHub issue](https://github.com/LinekForge/zhi/issues)，写上：
- 你期望发生什么
- 实际发生了什么
- 复现步骤

## 安全漏洞

**不要开公开 issue。** 请看 [SECURITY.md](SECURITY.md) 了解如何私下报告。

## License

参与贡献即表示你同意你的贡献以 [MIT License](LICENSE) 发布。
