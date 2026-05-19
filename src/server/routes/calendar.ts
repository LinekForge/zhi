import { Hono } from "hono";
import type { Context } from "hono";
import { and, like, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { buildByDate } from "./entries";
import { ERRORS } from "../shared";

const calendar = new Hono();

function parseYearMonth(c: Context) {
  const year = c.req.query("year") || String(new Date().getFullYear());
  const month = c.req.query("month") || String(new Date().getMonth() + 1);
  const y = Number(year), m = Number(month);
  if (!Number.isInteger(y) || y < 1000 || y > 9999) return null;
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  return { prefix: `${String(y)}-${String(m).padStart(2, "0")}` };
}

calendar.get("/calendar", async (c) => {
  const parsed = parseYearMonth(c);
  if (!parsed) return c.json({ error: ERRORS.INVALID_YEAR_MONTH }, 400);
  const rows = await db
    .select({ date: schema.entries.date, author: schema.entries.author })
    .from(schema.entries)
    .where(and(like(schema.entries.date, `${parsed.prefix}%`), eq(schema.entries.hidden, false)));
  return c.json(buildByDate(rows));
});

calendar.get("/stats/month", async (c) => {
  const parsed = parseYearMonth(c);
  if (!parsed) return c.json({ error: ERRORS.INVALID_YEAR_MONTH }, 400);
  const prefix = parsed.prefix;
  const rows = await db
    .select()
    .from(schema.entries)
    .where(and(like(schema.entries.date, `${prefix}%`), eq(schema.entries.hidden, false)));

  const totalChars = rows.reduce((s, r) => s + r.content.length, 0);
  const carbonCount = rows.filter((r) => r.author === "carbon").length;
  const siliconCount = rows.filter((r) => r.author === "silicon").length;

  const byDate: Record<string, number> = {};
  for (const r of rows) byDate[r.date] = (byDate[r.date] || 0) + 1;
  const busiestDay = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
  const longest = rows.sort((a, b) => b.content.length - a.content.length)[0];

  return c.json({
    totalEntries: rows.length,
    totalChars,
    carbonCount,
    siliconCount,
    busiestDay: busiestDay ? busiestDay[0] : null,
    longestEntry: longest
      ? { id: longest.id, date: longest.date, chars: longest.content.length }
      : null,
  });
});

export { calendar };
