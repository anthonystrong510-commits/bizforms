import DOMPurify from "dompurify";

const CONFIG = {
  ALLOWED_TAGS: [
    "p","br","strong","b","em","i","u","s","h1","h2","h3","h4","ul","ol","li",
    "blockquote","a","span","div","hr","code","pre","sup","sub",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
};

export function sanitizeRichText(html: string) {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html ?? "", CONFIG);
}

/** Renders admin-authored formatted copy (headings, lists, colours, fonts). */
export function RichText({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div
      className={`rt-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
