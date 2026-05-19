import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { parseId, ERRORS } from "../shared";
import { requireVisibleEntry } from "./entries";

const favorites = new Hono();

favorites.post("/entries/:id/favorite", async (c) => {
  const entryId = parseId(c.req.param("id"));
  if (!entryId) return c.json({ error: ERRORS.INVALID_ID }, 400);
  if (!await requireVisibleEntry(entryId)) return c.json({ error: ERRORS.NOT_FOUND }, 404);
  await db.insert(schema.favorites).values({ entryId, createdAt: new Date() }).onConflictDoNothing();
  return c.json({ ok: true });
});

favorites.delete("/entries/:id/favorite", async (c) => {
  const entryId = parseId(c.req.param("id"));
  if (!entryId) return c.json({ error: ERRORS.INVALID_ID }, 400);
  await db.delete(schema.favorites).where(eq(schema.favorites.entryId, entryId));
  return c.json({ ok: true });
});

export { favorites };
