export { IMAGES_DIR } from "./paths";

export const VALID_AUTHORS = new Set(["carbon", "silicon"]);
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EXT: Record<string, string> = { jpeg: "jpg", jpg: "jpg", png: "png", gif: "gif", webp: "webp" };

export function parseId(param: string): number | null {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const ERRORS = {
  INVALID_ID: "invalid id",
  INVALID_AUTHOR: "author must be carbon or silicon",
  INVALID_DATE: "invalid date format",
  CONTENT_REQUIRED: "content required",
  CONTENT_TOO_LONG: "content too long (max 50000 chars)",
  NOT_FOUND: "entry not found",
  FORBIDDEN: "can only edit own entries",
  HIDDEN: "cannot edit hidden entry",
  INVALID_YEAR_MONTH: "invalid year or month",
} as const;

export function validateAuthor(author: unknown): author is string {
  return typeof author === "string" && VALID_AUTHORS.has(author);
}

export function validateDate(date: unknown): date is string {
  if (typeof date !== "string" || !DATE_RE.test(date)) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const [y, m, day] = date.split("-").map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}
