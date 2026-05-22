import { Hono } from "hono";
import { readFileSync, writeFileSync } from "fs";
import { CONFIG_PATH } from "../paths";
const KNOWN_KEYS = new Set(["names", "mode", "badge", "dayFormat", "milestones"]);

const DEFAULTS = {
  names: { carbon: "碳基", silicon: "硅基" },
  mode: "duo",
  badge: "Day",
  dayFormat: "",
  milestones: { 10: "十天", 50: "五十天", 100: "一百天", 200: "两百天", 365: "一周年", 730: "两周年", 1000: "一千天" },
};

function read(): Record<string, unknown> {
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(data: Record<string, unknown>) {
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

const config = new Hono();

config.get("/config", (c) => c.json(read()));

config.patch("/config", async (c) => {
  let raw: Record<string, unknown>;
  try { raw = await c.req.json(); } catch { return c.json({ error: "invalid json" }, 400); }
  const patch: Record<string, unknown> = {};
  for (const k of Object.keys(raw)) {
    if (KNOWN_KEYS.has(k)) patch[k] = raw[k];
  }
  if (!Object.keys(patch).length) return c.json(read());
  const current = read();
  const merged = { ...current, ...patch };
  if (patch.names && typeof patch.names === "object") {
    merged.names = { ...(current.names as Record<string, string>), ...(patch.names as Record<string, string>) };
  }
  if (patch.milestones !== undefined && typeof patch.milestones === "object" && !Array.isArray(patch.milestones)) {
    merged.milestones = patch.milestones;
  }
  try { write(merged); } catch (e) { console.error("config write failed:", e); return c.json({ error: "write failed" }, 500); }
  return c.json(merged);
});

export { config };
