#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { existsSync, accessSync, constants } from "fs";
import { resolve } from "path";
import { createServer } from "net";

const ROOT = resolve(import.meta.dir, "..");

process.umask(0o077);

let failures = 0;
let warnings = 0;

function ok(label: string, detail = "") {
  console.log(`[OK]   ${label}${detail ? ": " + detail : ""}`);
}
function warn(label: string, detail = "") {
  warnings++;
  console.log(`[WARN] ${label}${detail ? ": " + detail : ""}`);
}
function fail(label: string, detail = "") {
  failures++;
  console.log(`[FAIL] ${label}${detail ? ": " + detail : ""}`);
}

// 1. Bun version
const bunVersion = Bun.version;
const [major] = bunVersion.split(".").map(Number);
if (major >= 1) ok("Bun", bunVersion);
else fail("Bun", `${bunVersion} — need 1.x+`);

// 2. Dependencies
const nmPath = resolve(ROOT, "node_modules");
if (existsSync(nmPath)) {
  const deps = ["hono", "drizzle-orm", "react", "react-dom"];
  const missing = deps.filter((d) => !existsSync(resolve(nmPath, d)));
  if (missing.length) fail("依赖", `缺少: ${missing.join(", ")}. 跑 bun install`);
  else ok("依赖", `${deps.length} 个核心包都在`);
} else {
  fail("依赖", "node_modules/ 不存在. 跑 bun install");
}

// 3. data/ directory
const dataDir = resolve(ROOT, "data");
const imagesDir = resolve(ROOT, "data/images");
try {
  if (!existsSync(dataDir)) {
    fail("data/", `${dataDir} 不存在. 跑 mkdir -p data/images`);
  } else if (!existsSync(imagesDir)) {
    fail("data/images", `${imagesDir} 不存在. 跑 mkdir -p data/images`);
  } else {
    accessSync(dataDir, constants.W_OK);
    ok("data/", "可写");
  }
} catch {
  fail("data/", "目录不可写");
}

// 4. SQLite
const dbPath = resolve(dataDir, "journal.db");
try {
  const testDb = new Database(":memory:");
  testDb.run("CREATE TABLE _t (id INTEGER PRIMARY KEY)");
  testDb.run("INSERT INTO _t (id) VALUES (1)");
  const row = testDb.query("SELECT id FROM _t WHERE id = 1").get() as { id: number } | null;
  testDb.close();
  if (row?.id === 1) ok("SQLite", "内存读写正常");
  else fail("SQLite", "读写测试失败");
  if (existsSync(dbPath)) ok("SQLite 数据库", dbPath);
  else warn("SQLite 数据库", `${dbPath} 尚未创建（首次启动时自动创建）`);
} catch (e) {
  fail("SQLite", e instanceof Error ? e.message : String(e));
}

// 5. Port
const port = Number(process.env.PORT) || 3000;
await new Promise<void>((done) => {
  const server = createServer();
  const timer = setTimeout(() => {
    server.close();
    fail(`端口 ${port}`, "检测超时");
    done();
  }, 3000);
  server.once("error", (err: NodeJS.ErrnoException) => {
    clearTimeout(timer);
    if (err.code === "EADDRINUSE") warn(`端口 ${port}`, "被占用. 启动前先关掉占用进程");
    else fail(`端口 ${port}`, err.message ?? "unknown error");
    done();
  });
  server.once("listening", () => {
    clearTimeout(timer);
    server.close();
    ok(`端口 ${port}`, "可用");
    done();
  });
  server.listen(port, "127.0.0.1");
});

// 6. Source files
const requiredFiles = [
  "src/client/app.jsx",
  "src/client/config.js",
  "src/client/main.jsx",
  "src/server/index.ts",
  "src/mcp/server.ts",
  "index.html",
];
const missingFiles = requiredFiles.filter((f) => !existsSync(resolve(ROOT, f)));
if (missingFiles.length) fail("源文件", `缺少: ${missingFiles.join(", ")}`);
else ok("源文件", `${requiredFiles.length} 个关键文件都在`);

// Result
console.log();
if (failures) {
  console.log(`doctor: ${failures} 个问题, ${warnings} 个警告`);
  process.exit(1);
} else {
  console.log(`doctor: 全部通过${warnings ? ` (${warnings} 个警告)` : ""}`);
}
