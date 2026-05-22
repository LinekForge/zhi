import { Hono } from "hono";
import { eq, and, gte, lte, inArray, sql, desc } from "drizzle-orm";
import { db, schema } from "../db";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { validateAuthor, validateDate, parseId, ERRORS, IMAGES_DIR, MAX_IMAGE_BYTES, ALLOWED_EXT } from "../shared";

const entries = new Hono();

// ── Helpers ───────────────────────────────────────────────────────────

async function requireVisibleEntry(id: number) {
  const [entry] = await db
    .select({ id: schema.entries.id })
    .from(schema.entries)
    .where(and(eq(schema.entries.id, id), eq(schema.entries.hidden, false)));
  return entry ?? null;
}

async function getOwnEntry(id: number, author: string) {
  const [entry] = await db
    .select()
    .from(schema.entries)
    .where(eq(schema.entries.id, id));
  if (!entry) return { error: ERRORS.NOT_FOUND, status: 404 as const };
  if (entry.author !== author)
    return { error: ERRORS.FORBIDDEN, status: 403 as const };
  return { entry };
}

function enrichEntries(
  rows: (typeof schema.entries.$inferSelect)[],
  imageRows: (typeof schema.images.$inferSelect)[],
  annotationRows: (typeof schema.annotations.$inferSelect)[],
  editRows: (typeof schema.edits.$inferSelect)[],
  favIds: Set<number>
) {
  const imagesByEntry = groupBy(imageRows, "entryId");
  const annotationsByEntry = groupBy(annotationRows, "entryId");
  const editsByEntry = groupBy(editRows, "entryId");

  return rows.map((r) => ({
    ...r,
    images: (imagesByEntry[r.id] || []).sort((a, b) => a.order - b.order),
    annotations: annotationsByEntry[r.id] || [],
    editHistory: editsByEntry[r.id] || [],
    favorited: favIds.has(r.id),
  }));
}

function groupBy<T>(arr: T[], key: keyof T): Record<number, T[]> {
  const map: Record<number, T[]> = {};
  for (const item of arr) {
    const k = item[key] as unknown as number;
    (map[k] = map[k] || []).push(item);
  }
  return map;
}

function buildByDate(rows: { date: string; author: string }[]) {
  const byDate: Record<string, { carbon: boolean; silicon: boolean }> = {};
  for (const r of rows) {
    byDate[r.date] = byDate[r.date] || { carbon: false, silicon: false };
    byDate[r.date][r.author as "carbon" | "silicon"] = true;
  }
  return byDate;
}

// ── Routes ────────────────────────────────────────────────────────────

entries.get("/pulse", (c) => {
  const row = db
    .select({ ts: schema.entries.createdAt })
    .from(schema.entries)
    .orderBy(desc(schema.entries.createdAt))
    .limit(1)
    .get();
  return c.json({ ts: row?.ts ? +row.ts : 0 });
});

entries.get("/entries", async (c) => {
  const { date, author, from, to, long, q, showHidden } = c.req.query();

  if (date !== undefined && !validateDate(date)) return c.json({ error: ERRORS.INVALID_DATE }, 400);
  if (from !== undefined && !validateDate(from)) return c.json({ error: ERRORS.INVALID_DATE }, 400);
  if (to !== undefined && !validateDate(to)) return c.json({ error: ERRORS.INVALID_DATE }, 400);
  if (author !== undefined && !validateAuthor(author)) return c.json({ error: ERRORS.INVALID_AUTHOR }, 400);

  const where: ReturnType<typeof eq>[] = [];
  if (showHidden !== "true") {
    where.push(eq(schema.entries.hidden, false));
  }
  if (date) where.push(eq(schema.entries.date, date));
  if (author) where.push(eq(schema.entries.author, author));
  if (from) where.push(gte(schema.entries.date, from));
  if (to) where.push(lte(schema.entries.date, to));
  if (long === "true") {
    where.push(gte(sql`length(${schema.entries.content})`, 220));
  }

  let rows = await db
    .select()
    .from(schema.entries)
    .where(where.length ? and(...where) : undefined)
    .orderBy(schema.entries.date, schema.entries.createdAt);

  if (q) {
    const term = q.toLowerCase();
    const escapedTerm = term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    const matchingAnnotationEntryIds = await db
      .selectDistinct({ entryId: schema.annotations.entryId })
      .from(schema.annotations)
      .where(sql`${schema.annotations.content} LIKE ${"%" + escapedTerm + "%"} ESCAPE '\\'`);
    const annotationEntryIdSet = new Set(matchingAnnotationEntryIds.map((a) => a.entryId));

    rows = rows.filter(
      (r) =>
        r.content.toLowerCase().includes(term) ||
        annotationEntryIdSet.has(r.id)
    );
  }

  if (!rows.length) return c.json([]);

  const entryIds = rows.map((r) => r.id);
  const [imageRows, annotationRows, editRows, favRows] = await Promise.all([
    db.select().from(schema.images).where(inArray(schema.images.entryId, entryIds)),
    db.select().from(schema.annotations).where(inArray(schema.annotations.entryId, entryIds)),
    db.select().from(schema.edits).where(inArray(schema.edits.entryId, entryIds)),
    db.select().from(schema.favorites).where(inArray(schema.favorites.entryId, entryIds)),
  ]);

  const favIds = new Set(favRows.map((f) => f.entryId));
  return c.json(enrichEntries(rows, imageRows, annotationRows, editRows, favIds));
});

entries.get("/entries/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return c.json({ error: ERRORS.INVALID_ID }, 400);
  const showHidden = c.req.query("showHidden") === "true";
  const where = showHidden
    ? eq(schema.entries.id, id)
    : and(eq(schema.entries.id, id), eq(schema.entries.hidden, false));
  const [entry] = await db.select().from(schema.entries).where(where);
  if (!entry) return c.json({ error: ERRORS.NOT_FOUND }, 404);

  const [images, annotations, edits, favs] = await Promise.all([
    db.select().from(schema.images).where(eq(schema.images.entryId, id)).orderBy(schema.images.order),
    db.select().from(schema.annotations).where(eq(schema.annotations.entryId, id)),
    db.select().from(schema.edits).where(eq(schema.edits.entryId, id)),
    db.select().from(schema.favorites).where(eq(schema.favorites.entryId, id)),
  ]);

  return c.json({
    ...entry,
    images,
    annotations,
    editHistory: edits,
    favorited: favs.length > 0,
  });
});

entries.post("/entries", async (c) => {
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ error: "invalid json" }, 400); }
  if (!validateAuthor(body.author)) return c.json({ error: ERRORS.INVALID_AUTHOR }, 400);
  if (!body.content?.trim()) return c.json({ error: ERRORS.CONTENT_REQUIRED }, 400);
  if (body.content.length > 50000) return c.json({ error: ERRORS.CONTENT_TOO_LONG }, 400);
  if (body.date && !validateDate(body.date)) return c.json({ error: ERRORS.INVALID_DATE }, 400);
  if (Array.isArray(body.images) && body.images.length > 9) {
    return c.json({ error: "too many images (max 9)" }, 400);
  }
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const result = await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(schema.entries)
      .values({
        author: body.author,
        content: body.content,
        date: body.date || today,
        writtenAt: body.writtenAt,
        createdAt: now,
        hidden: false,
      })
      .returning();

    const savedImages: { id: number; path: string; order: number }[] = [];

    if (body.images && Array.isArray(body.images)) {
      await mkdir(IMAGES_DIR, { recursive: true });
      for (let i = 0; i < body.images.length; i++) {
        let imgPath = body.images[i];

        if (typeof imgPath === "string" && imgPath.startsWith("data:")) {
          const match = imgPath.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s);
          if (!match) continue;
          const raw = Buffer.from(match[2], "base64");
          if (raw.length > MAX_IMAGE_BYTES) continue;
          const ext = ALLOWED_EXT[match[1].toLowerCase()];
          if (!ext) continue;
          const filename = `${randomUUID()}.${ext}`;
          const filePath = resolve(IMAGES_DIR, filename);
          try { await writeFile(filePath, raw); } catch (e) { console.error("image write failed:", e); continue; }
          imgPath = `/images/${filename}`;
        } else if (typeof imgPath === "string" && /^\/images\/[0-9a-f-]+\.\w+$/.test(imgPath)) {
          // re-use existing image path — validated UUID format
        } else {
          continue;
        }

        const [img] = await tx
          .insert(schema.images)
          .values({ entryId: entry.id, path: imgPath, order: i, createdAt: now })
          .returning();
        savedImages.push(img);
      }
    }

    return { ...entry, images: savedImages };
  });

  return c.json(result, 201);
});

entries.patch("/entries/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return c.json({ error: ERRORS.INVALID_ID }, 400);
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ error: "invalid json" }, 400); }
  if (!validateAuthor(body.author)) return c.json({ error: ERRORS.INVALID_AUTHOR }, 400);
  if (!body.content?.trim()) return c.json({ error: ERRORS.CONTENT_REQUIRED }, 400);
  if (body.content.length > 50000) return c.json({ error: ERRORS.CONTENT_TOO_LONG }, 400);

  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(schema.entries)
      .where(eq(schema.entries.id, id));
    if (!current) return { error: ERRORS.NOT_FOUND, status: 404 as const };
    if (current.author !== body.author)
      return { error: ERRORS.FORBIDDEN, status: 403 as const };
    if (current.hidden) return { error: ERRORS.HIDDEN, status: 400 as const };
    if (current.content === body.content)
      return { entry: current };

    await tx.insert(schema.edits).values({
      entryId: id,
      prevContent: current.content,
      editedAt: now,
    });
    const [updated] = await tx
      .update(schema.entries)
      .set({ content: body.content, updatedAt: now })
      .where(eq(schema.entries.id, id))
      .returning();
    return { entry: updated };
  });

  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result.entry);
});

entries.delete("/entries/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return c.json({ error: ERRORS.INVALID_ID }, 400);
  const body: { author?: unknown } = await c.req.json().catch(() => ({}));
  if (!validateAuthor(body.author)) return c.json({ error: ERRORS.INVALID_AUTHOR }, 400);
  const check = await getOwnEntry(id, body.author);
  if ("error" in check) return c.json({ error: check.error }, check.status);

  await db.update(schema.entries).set({ hidden: true }).where(eq(schema.entries.id, id));
  return c.json({ ok: true });
});

entries.post("/entries/:id/unhide", async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return c.json({ error: ERRORS.INVALID_ID }, 400);
  const body: { author?: unknown } = await c.req.json().catch(() => ({}));
  if (!validateAuthor(body.author)) return c.json({ error: ERRORS.INVALID_AUTHOR }, 400);
  const check = await getOwnEntry(id, body.author);
  if ("error" in check) return c.json({ error: check.error }, check.status);

  await db.update(schema.entries).set({ hidden: false }).where(eq(schema.entries.id, id));
  return c.json({ ok: true });
});

export { entries, requireVisibleEntry, buildByDate };
