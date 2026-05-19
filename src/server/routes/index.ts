import { Hono } from "hono";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { entries } from "./entries";
import { annotations } from "./annotations";
import { favorites } from "./favorites";
import { calendar } from "./calendar";
import { typing } from "./typing";

const api = new Hono();

api.get("/health", (c) => {
  try {
    db.get(sql`SELECT 1`);
    return c.json({ status: "ok", uptime: Math.floor(process.uptime()) });
  } catch (e) {
    return c.json({ status: "error" }, 500);
  }
});

api.route("/", entries);
api.route("/", annotations);
api.route("/", favorites);
api.route("/", calendar);
api.route("/", typing);

export { api };
