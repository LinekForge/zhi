import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { api } from "./routes/index";
import { resolve } from "path";

const app = new Hono();

app.onError((err, c) => {
  console.error('API error:', err);
  return c.json({ error: 'internal server error' }, 500);
});

app.use("/api/*", logger());
app.route("/api", api);

// Serve uploaded images
app.use(
  "/images/*",
  serveStatic({ root: resolve(import.meta.dir, "../../data") })
);

// Serve frontend (Vite build output) — static assets first, SPA fallback second
const distPath = resolve(import.meta.dir, "../../dist");
app.use("/assets/*", serveStatic({ root: distPath }));
app.get("*", serveStatic({ root: distPath, path: "/index.html" }));

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  hostname: "127.0.0.1",
  fetch: app.fetch,
};

console.log(`织 API · http://localhost:${port} (open http://localhost:5173 for the UI)`);
