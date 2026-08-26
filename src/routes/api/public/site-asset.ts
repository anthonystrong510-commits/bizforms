import { createFileRoute } from "@tanstack/react-router";

const SAFE_PATH = /^(hero|forms|branding)\/[a-zA-Z0-9._-]+$/;

export const Route = createFileRoute("/api/public/site-asset")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).searchParams.get("path") ?? "";
        if (!SAFE_PATH.test(path)) return new Response("Invalid image path", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("site-assets").download(path);
        if (error || !data) return new Response("Image not found", { status: 404 });
        if (!data.type.startsWith("image/")) return new Response("Unsupported file", { status: 415 });

        return new Response(data, {
          headers: {
            "Content-Type": data.type,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});