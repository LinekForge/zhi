import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  author: text("author").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),
  writtenAt: text("written_at"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  hidden: integer("hidden", { mode: "boolean" }).default(false),
}, (table) => [
  index("idx_entries_date").on(table.date),
  index("idx_entries_date_hidden").on(table.date, table.hidden),
  index("idx_entries_author").on(table.author),
]);

export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id")
    .notNull()
    .references(() => entries.id),
  path: text("path").notNull(),
  order: integer("order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("idx_images_entry_id").on(table.entryId),
]);

export const annotations = sqliteTable("annotations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id")
    .notNull()
    .references(() => entries.id),
  author: text("author").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("idx_annotations_entry_id").on(table.entryId),
]);

export const edits = sqliteTable("edits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id")
    .notNull()
    .references(() => entries.id),
  prevContent: text("prev_content").notNull(),
  editedAt: integer("edited_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("idx_edits_entry_id").on(table.entryId),
]);

export const favorites = sqliteTable("favorites", {
  entryId: integer("entry_id")
    .primaryKey()
    .references(() => entries.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
