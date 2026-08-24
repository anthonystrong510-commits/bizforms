export type QuestionType =
  | "short_text"
  | "long_text"
  | "choice"
  | "checkbox"
  | "dropdown"
  | "rating"
  | "date"
  | "email"
  | "number"
  | "rich_text";

/** Types that display content instead of collecting an answer. */
export const CONTENT_TYPES = ["rich_text"];
export const isContentBlock = (type: string) => CONTENT_TYPES.includes(type);

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "short_text", label: "Short answer" },
  { value: "long_text", label: "Long answer" },
  { value: "choice", label: "Multiple choice" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "dropdown", label: "Dropdown" },
  { value: "rating", label: "Rating" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
];

export const THEMES = [
  { value: "crimson", label: "Crimson", className: "banner-crimson" },
  { value: "teal", label: "Teal", className: "banner-teal" },
  { value: "amber", label: "Amber", className: "banner-amber" },
  { value: "plum", label: "Plum", className: "banner-plum" },
  { value: "forest", label: "Forest", className: "banner-forest" },
];

export function themeClass(theme?: string | null) {
  return THEMES.find((t) => t.value === theme)?.className ?? "banner-crimson";
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function randomCode(length = 7) {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function slugify(title: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "form";
  return `${base}-${randomCode(5)}`;
}

export type FormSection = { title: string; description: string };

export function parseSections(raw: unknown): FormSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    if (typeof s === "string") return { title: s, description: "" };
    const o = (s ?? {}) as Record<string, unknown>;
    return {
      title: typeof o.title === "string" ? o.title : "",
      description: typeof o.description === "string" ? o.description : "",
    };
  });
}

export function origin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

/** Links always follow whatever domain the app is currently served from. */
export function formLinks(slug: string, shortCode: string) {
  const base = origin();
  return { long: `${base}/form/${slug}`, short: `${base}/f/${shortCode}` };
}

