import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "reset-localstorage",
      configureServer(server) {
        server.middlewares.use("/__reset", (_req, res) => {
          res.setHeader("Content-Type", "text/html");
          res.end(`<!DOCTYPE html>
<html><body>
<script>
  localStorage.clear();
  sessionStorage.clear();
  document.title = "cleared";
  setTimeout(() => location.replace("/"), 300);
</script>
<p>Storage cleared. Redirecting...</p>
</body></html>`);
        });
      },
    },
  ],
  root: ".",
  build: {
    outDir: "dist",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": `http://localhost:${process.env.PORT || 3000}`,
      "/images": `http://localhost:${process.env.PORT || 3000}`,
    },
  },
});
