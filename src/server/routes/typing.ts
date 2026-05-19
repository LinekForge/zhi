import { Hono } from "hono";

const typing = new Hono();

let siliconTyping = false;
let siliconTypingTimer: ReturnType<typeof setTimeout> | null = null;

typing.post("/silicon/typing", async (c) => {
  siliconTyping = true;
  if (siliconTypingTimer) clearTimeout(siliconTypingTimer);
  siliconTypingTimer = setTimeout(() => (siliconTyping = false), 30000);
  return c.json({ ok: true });
});

typing.get("/silicon/typing", async (c) => {
  return c.json({ typing: siliconTyping });
});

export { typing };
