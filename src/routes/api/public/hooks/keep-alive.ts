import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Keep-alive endpoint pinged by a scheduled job so the backend never goes
 * idle/paused. It performs one tiny authenticated-as-anon read.
 */
async function ping() {
  const authHeaderKey = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!url || !authHeaderKey) {
    return new Response(JSON.stringify({ ok: false, error: "Backend not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, authHeaderKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (authHeaderKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${authHeaderKey}`) {
          h.delete("Authorization");
        }
        h.set("apikey", authHeaderKey);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { error } = await supabase.from("site_content").select("id").limit(1);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, at: new Date().toISOString() }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/keep-alive")({
  server: {
    handlers: {
      GET: async () => ping(),
      POST: async () => ping(),
    },
  },
});
