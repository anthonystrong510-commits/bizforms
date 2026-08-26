import { useEffect } from "react";
import { useSite } from "@/lib/site";
import { normalizeImageUrl } from "@/lib/site-assets";

export function SiteFavicon() {
  const { data } = useSite();

  useEffect(() => {
    const href = normalizeImageUrl(data?.favicon_url);
    if (!href) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.append(link);
    }
    link.href = href;
    link.type = "image/*";
  }, [data?.favicon_url]);

  return null;
}