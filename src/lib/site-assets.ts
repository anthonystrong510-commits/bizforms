import { supabase } from "@/integrations/supabase/client";

const SITE_ASSET_ROUTE = "/api/public/site-asset";

/** Accept old database values such as quoted URLs, JSON arrays, or { url } objects. */
export function normalizeImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  let cleaned = value.trim();
  if (!cleaned) return "";

  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (typeof parsed === "string") cleaned = parsed.trim();
    else if (Array.isArray(parsed) && typeof parsed[0] === "string") cleaned = parsed[0].trim();
    else if (parsed && typeof parsed === "object" && "url" in parsed) {
      const url = (parsed as { url?: unknown }).url;
      if (typeof url === "string") cleaned = url.trim();
    }
  } catch {
    cleaned = cleaned.replace(/^[\[({'"\s]+|[\])}'"\s]+$/g, "");
  }

  if (/^(https?:\/\/|\/)/i.test(cleaned)) return cleaned;
  return "";
}

export function siteAssetUrl(path: string): string {
  return `${SITE_ASSET_ROUTE}?path=${encodeURIComponent(path)}`;
}

export async function uploadSiteImage(file: File, folder: "hero" | "forms" | "branding") {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Images must be smaller than 10 MB.");

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return siteAssetUrl(path);
}