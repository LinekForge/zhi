#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, cpSync } from "fs";
import { resolve } from "path";
import { DB_PATH, IMAGES_DIR, BACKUP_DIR } from "../src/server/paths";

process.umask(0o077);

if (!existsSync(DB_PATH)) {
  console.log("数据库不存在，无需备份");
  process.exit(0);
}

mkdirSync(BACKUP_DIR, { recursive: true });

const now = new Date();
const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
const backupDb = resolve(BACKUP_DIR, `journal-${timestamp}.db`);

const src = new Database(DB_PATH);
src.run(`VACUUM INTO '${backupDb}'`);
src.close();

console.log(`[OK] 数据库备份: ${backupDb}`);

if (existsSync(IMAGES_DIR)) {
  const backupImages = resolve(BACKUP_DIR, `images-${timestamp}`);
  cpSync(IMAGES_DIR, backupImages, { recursive: true });
  console.log(`[OK] 图片备份: ${backupImages}`);
}

console.log("备份完成");
