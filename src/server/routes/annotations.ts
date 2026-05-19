import { Hono } from "hono";
import { db, schema } from "../db";
import { validateAuthor, parseId, ERRORS } from "../shared";
import { requireVisibleEntry } from "./entries";

const annotations = new Hono();

annotations.post("/entries/:id/annotations", async (c) => {
  const entryId = parseId(c.req.param("id"));
  if (!entryId) return c.json({ error: ERRORS.INVALID_ID }, 400);
  const body = await c.req.json();
  if (!validateAuthor(body.author)) return c.json({ error: ERRORS.INVALID_AUTHOR }, 400);
  if (!body.content?.trim()) return c.json({ error: ERRORS.CONTENT_REQUIRED }, 400);
  if (body.content.length > 50000) return c.json({ error: ERRORS.CONTENT_TOO_LONG }, 400);
  if (!await requireVisibleEntry(entryId)) return c.json({ error: ERRORS.NOT_FOUND }, 404);

  const [annotation] = await db
    .insert(schema.annotations)
    .values({ entryId, author: body.author, content: body.content, createdAt: new Date() })
    .returning();

  return c.json(annotation, 201);
});

export { annotations };
