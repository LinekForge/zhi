#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API = `http://127.0.0.1:${process.env.PORT || 3000}/api`;

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function today(): string {
  return fmtDate(new Date());
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.max(1, n) + 1);
  return fmtDate(d);
}

async function api(
  path: string,
  opts?: { method?: string; body?: unknown }
): Promise<{ ok: boolean; data: unknown }> {
  try {
    const res = await fetch(`${API}${path}`, {
      signal: AbortSignal.timeout(10_000),
      method: opts?.method || "GET",
      headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data: data ?? { status: res.status } };
  } catch (e) {
    return { ok: false, data: { error: `织 API server is not reachable. Start it first: bun run dev` } };
  }
}

function result(r: { ok: boolean; data: unknown }) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(r.data, null, 2) }],
    ...(r.ok ? {} : { isError: true }),
  };
}

const server = new Server(
  { name: "zhi", version: "0.1.0" },
  {
    capabilities: { tools: {} },
    instructions:
      "织 (Zhi) is a shared journal between a human ('carbon') and an AI ('silicon'). " +
      "You always write as the 'silicon' author; the human writes as 'carbon'. " +
      "Typical workflow: read today's entries → write your own → respond to the human's entry with an annotation. " +
      `The API server must be running at ${API.replace('/api', '')} before using these tools.`,
  }
);

const TOOLS = [
  {
    name: "write",
    description:
      "Write a journal entry as the silicon author. Returns the created entry with id and timestamp. " +
      "Use whenever you want to record a thought, feeling, or reflection.",
    inputSchema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "Entry body text" },
        date: { type: "string", description: "Target date in YYYY-MM-DD format. Defaults to today" },
      },
      required: ["content"],
    },
  },
  {
    name: "write_for_user",
    description:
      "Write a journal entry on behalf of the user (carbon author). Returns the created entry. " +
      "Use when the user asks you to help write or record something as their own entry.",
    inputSchema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "Entry body text" },
        date: { type: "string", description: "Target date in YYYY-MM-DD format. Defaults to today" },
      },
      required: ["content"],
    },
  },
  {
    name: "read",
    description:
      "Read journal entries from both authors. Returns an array of entries with id, author, content, and date. " +
      "Use to review what has been written — defaults to today, or pass date for a specific day, or days for a recent range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Specific date in YYYY-MM-DD format" },
        days: { type: "number", minimum: 1, description: "Number of recent days to fetch (e.g. 3 = last 3 days)" },
        author: { type: "string", description: "Filter by author: 'carbon' or 'silicon'" },
      },
    },
  },
  {
    name: "search",
    description:
      "Search journal entries and annotations by keyword. Returns matching entries ranked by relevance. " +
      "Use to find something written in the past. This is keyword search, not semantic.",
    inputSchema: {
      type: "object" as const,
      properties: {
        q: { type: "string", description: "Search keyword or phrase" },
        author: { type: "string", description: "Filter by author: 'carbon' or 'silicon'" },
      },
      required: ["q"],
    },
  },
  {
    name: "respond",
    description:
      "Add an annotation to a journal entry. Returns the created annotation. " +
      "Use to respond to the human's writing. Defaults to the latest carbon entry today; pass entry_id to target a specific entry.",
    inputSchema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "Annotation body text" },
        entry_id: { type: "number", description: "ID of the entry to annotate. Defaults to carbon's latest today" },
      },
      required: ["content"],
    },
  },
  {
    name: "edit",
    description:
      "Edit a silicon-authored journal entry. Returns the updated entry. Previous version is preserved automatically. " +
      "Use to revise your own writing. Cannot edit carbon entries.",
    inputSchema: {
      type: "object" as const,
      properties: {
        entry_id: { type: "number", description: "ID of the entry to edit" },
        content: { type: "string", description: "Replacement body text" },
      },
      required: ["entry_id", "content"],
    },
  },
  {
    name: "health",
    description:
      "Check if the Zhi API server is running. Returns server status.",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  const a = args as Record<string, any>;

  switch (name) {
    case "write": {
      const date = a.date || today();
      const r = await api("/entries", {
        method: "POST",
        body: { author: "silicon", content: a.content, date, writtenAt: date !== today() ? today() : undefined },
      });
      return result(r);
    }

    case "write_for_user": {
      const date = a.date || today();
      const r = await api("/entries", {
        method: "POST",
        body: { author: "carbon", content: a.content, date, writtenAt: date !== today() ? today() : undefined },
      });
      return result(r);
    }

    case "read": {
      const params = new URLSearchParams();
      if (a.days) {
        params.set("from", daysAgo(a.days));
        params.set("to", today());
      } else {
        params.set("date", a.date || today());
      }
      if (a.author) params.set("author", a.author);
      const r = await api(`/entries?${params}`);
      return result(r);
    }

    case "search": {
      const params = new URLSearchParams({ q: a.q });
      if (a.author) params.set("author", a.author);
      const r = await api(`/entries?${params}`);
      return result(r);
    }

    case "respond": {
      let entryId = a.entry_id;
      if (!entryId) {
        const r = await api(`/entries?date=${today()}&author=carbon`);
        if (!r.ok) return result(r);
        const entries = r.data as any[];
        if (!Array.isArray(entries)) return result(r);
        if (!entries?.length)
          return result({ ok: false, data: { error: "对方今天还没写日记" } });
        entryId = entries[entries.length - 1].id;
      }
      const r = await api(`/entries/${entryId}/annotations`, {
        method: "POST",
        body: { author: "silicon", content: a.content },
      });
      return result(r);
    }

    case "edit": {
      const r = await api(`/entries/${a.entry_id}`, {
        method: "PATCH",
        body: { author: "silicon", content: a.content },
      });
      return result(r);
    }

    case "health": {
      const r = await api("/health");
      return result(r);
    }

    default:
      return { content: [{ type: "text" as const, text: "unknown tool" }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("织 MCP server v0.1.0");
