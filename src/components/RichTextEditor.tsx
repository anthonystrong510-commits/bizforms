import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Link2,
  Eraser,
  Minus,
} from "lucide-react";
import { sanitizeRichText } from "@/components/RichText";

const FONTS = [
  { label: "Body (sans)", value: "var(--font-sans, ui-sans-serif)" },
  { label: "Display serif", value: "var(--font-serif, Georgia, serif)" },
  { label: "Mono", value: "var(--font-mono, ui-monospace)" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "'Times New Roman', serif" },
  { label: "Courier", value: "'Courier New', monospace" },
];

const COLORS = ["#111827", "#b91c1c", "#c2410c", "#a16207", "#15803d", "#0f766e", "#1d4ed8", "#7e22ce"];

const BLOCKS = [
  { label: "Paragraph", value: "P" },
  { label: "Title (H1)", value: "H1" },
  { label: "Heading (H2)", value: "H2" },
  { label: "Subheading (H3)", value: "H3" },
];

const SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Huge", value: "6" },
];

/** Word-style editor for admin-authored text blocks. Emits sanitized HTML on blur. */
export function RichTextEditor({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = sanitizeRichText(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const run = (cmd: string, arg?: string) => {
    if (disabled) return;
    ref.current?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, arg);
    commit();
  };

  const commit = () => {
    if (!ref.current) return;
    const html = sanitizeRichText(ref.current.innerHTML);
    if (html !== value) onChange(html);
  };

  const btn =
    "inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50";

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
        <select
          aria-label="Text style"
          disabled={disabled}
          className="h-8 rounded-md border bg-background px-2 text-xs"
          defaultValue="P"
          onChange={(e) => run("formatBlock", e.target.value)}
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Font"
          disabled={disabled}
          className="h-8 rounded-md border bg-background px-2 text-xs"
          defaultValue=""
          onChange={(e) => e.target.value && run("fontName", e.target.value)}
        >
          <option value="">Font</option>
          {FONTS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Size"
          disabled={disabled}
          className="h-8 rounded-md border bg-background px-2 text-xs"
          defaultValue="3"
          onChange={(e) => run("fontSize", e.target.value)}
        >
          {SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <span className="mx-1 h-6 w-px bg-border" />
        <button type="button" className={btn} disabled={disabled} title="Bold" onClick={() => run("bold")}>
          <Bold className="size-4" />
        </button>
        <button type="button" className={btn} disabled={disabled} title="Italic" onClick={() => run("italic")}>
          <Italic className="size-4" />
        </button>
        <button type="button" className={btn} disabled={disabled} title="Underline" onClick={() => run("underline")}>
          <Underline className="size-4" />
        </button>
        <button
          type="button"
          className={btn}
          disabled={disabled}
          title="Strikethrough"
          onClick={() => run("strikeThrough")}
        >
          <Strikethrough className="size-4" />
        </button>

        <span className="mx-1 h-6 w-px bg-border" />
        <button type="button" className={btn} disabled={disabled} title="Bulleted list" onClick={() => run("insertUnorderedList")}>
          <List className="size-4" />
        </button>
        <button type="button" className={btn} disabled={disabled} title="Numbered list" onClick={() => run("insertOrderedList")}>
          <ListOrdered className="size-4" />
        </button>
        <button type="button" className={btn} disabled={disabled} title="Quote" onClick={() => run("formatBlock", "BLOCKQUOTE")}>
          <Quote className="size-4" />
        </button>
        <button type="button" className={btn} disabled={disabled} title="Divider" onClick={() => run("insertHorizontalRule")}>
          <Minus className="size-4" />
        </button>

        <span className="mx-1 h-6 w-px bg-border" />
        <button type="button" className={btn} disabled={disabled} title="Align left" onClick={() => run("justifyLeft")}>
          <AlignLeft className="size-4" />
        </button>
        <button type="button" className={btn} disabled={disabled} title="Align centre" onClick={() => run("justifyCenter")}>
          <AlignCenter className="size-4" />
        </button>
        <button type="button" className={btn} disabled={disabled} title="Align right" onClick={() => run("justifyRight")}>
          <AlignRight className="size-4" />
        </button>

        <span className="mx-1 h-6 w-px bg-border" />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={`Colour ${c}`}
            aria-label={`Text colour ${c}`}
            disabled={disabled}
            onClick={() => run("foreColor", c)}
            className="size-5 rounded-full border"
            style={{ backgroundColor: c }}
          />
        ))}

        <button
          type="button"
          className={`${btn} ml-auto`}
          disabled={disabled}
          title="Add link"
          onClick={() => {
            const url = window.prompt("Link URL (https://…)");
            if (url && /^https?:\/\//i.test(url)) run("createLink", url);
          }}
        >
          <Link2 className="size-4" />
        </button>
        <button
          type="button"
          className={btn}
          disabled={disabled}
          title="Clear formatting"
          onClick={() => run("removeFormat")}
        >
          <Eraser className="size-4" />
        </button>
      </div>

      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Formatted text block"
        onBlur={commit}
        className="rt-content min-h-32 px-4 py-3 text-sm outline-none"
        data-placeholder="Write your intro, notes, pricing details, rules…"
      />
    </div>
  );
}
