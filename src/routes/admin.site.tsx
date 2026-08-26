import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageUp, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { fetchSite, type SiteContent } from "@/lib/site";
import { normalizeImageUrl, uploadSiteImage } from "@/lib/site-assets";

export const Route = createFileRoute("/admin/site")({
  head: () => ({
    meta: [
      { title: "Event content — Market Fest admin" },
      {
        name: "description",
        content: "Edit event dates, booth pricing, policies and footer details for the event site.",
      },
      { property: "og:title", content: "Event content — Market Fest admin" },
      { property: "og:description", content: "Edit the public event website content." },
    ],
  }),
  component: SiteEditor,
});

function SiteEditor() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [uploading, setUploading] = useState<"hero" | "favicon" | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data } = useQuery({ queryKey: ["site-content"], queryFn: fetchSite });

  useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data, draft]);

  const save = useMutation({
    mutationFn: async (next: SiteContent) => {
      const clean = {
        ...next,
        favicon_url: normalizeImageUrl(next.favicon_url),
        hero: { ...next.hero, image_url: normalizeImageUrl(next.hero.image_url) },
      };
      const { error } = await supabase
        .from("site_content")
        .update({ data: clean as never })
        .eq("id", "main");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event content saved");
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!draft) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Event content" />
        <p className="p-8 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const d = draft;
  const patch = (part: Partial<SiteContent>) => setDraft({ ...d, ...part });

  async function upload(file: File, kind: "hero" | "favicon") {
    setUploading(kind);
    try {
      const url = await uploadSiteImage(file, kind === "hero" ? "hero" : "branding");
      if (kind === "hero") patch({ hero: { ...d.hero, image_url: url } });
      else patch({ favicon_url: url });
      toast.success(`${kind === "hero" ? "Hero image" : "Favicon"} uploaded. Save changes to publish it.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Event content" />

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold">Event website content</h1>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">View site</Link>
            </Button>
            <Button onClick={() => save.mutate(d)} disabled={!isAdmin || save.isPending}>
              <Save className="size-4" /> {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
        {!isAdmin && !loading ? (
          <p className="text-sm text-destructive">Admin access is required to save changes.</p>
        ) : null}

        <Card title="Brand & hero">
          <Field label="Brand name" value={d.brand} onChange={(v) => patch({ brand: v })} />
          <Field
            label="Hero eyebrow"
            value={d.hero.eyebrow}
            onChange={(v) => patch({ hero: { ...d.hero, eyebrow: v } })}
          />
          <Field
            label="Hero title"
            value={d.hero.title}
            onChange={(v) => patch({ hero: { ...d.hero, title: v } })}
          />
          <Field
            label="Hero lede"
            area
            value={d.hero.lede}
            onChange={(v) => patch({ hero: { ...d.hero, lede: v } })}
          />
          <ImageField
            label="Hero image"
            value={d.hero.image_url}
            busy={uploading === "hero"}
            onChange={(v) => patch({ hero: { ...d.hero, image_url: v })}
            onUpload={(file) => upload(file, "hero")}
          />
          <ImageField
            label="Browser favicon"
            value={d.favicon_url}
            busy={uploading === "favicon"}
            square
            onChange={(v) => patch({ favicon_url: v })}
            onUpload={(file) => upload(file, "favicon")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Primary button"
              value={d.hero.primary_cta}
              onChange={(v) => patch({ hero: { ...d.hero, primary_cta: v } })}
            />
            <Field
              label="Secondary button"
              value={d.hero.secondary_cta}
              onChange={(v) => patch({ hero: { ...d.hero, secondary_cta: v } })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Badge top"
              value={d.badge.top}
              onChange={(v) => patch({ badge: { ...d.badge, top: v } })}
            />
            <Field
              label="Badge middle"
              value={d.badge.middle}
              onChange={(v) => patch({ badge: { ...d.badge, middle: v } })}
            />
            <Field
              label="Badge bottom"
              value={d.badge.bottom}
              onChange={(v) => patch({ badge: { ...d.badge, bottom: v } })}
            />
          </div>
        </Card>

        <Card title="Quick facts (dates, hours, location)">
          <Repeater
            items={d.facts}
            onChange={(facts) => patch({ facts })}
            blank={{ label: "", value: "" }}
            render={(f, set) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Label" value={f.label} onChange={(v) => set({ ...f, label: v })} />
                <Field label="Value" value={f.value} onChange={(v) => set({ ...f, value: v })} />
              </div>
            )}
          />
        </Card>

        <Card title="About the event">
          <Field
            label="Eyebrow"
            value={d.overview.eyebrow}
            onChange={(v) => patch({ overview: { ...d.overview, eyebrow: v } })}
          />
          <Field
            label="Title"
            value={d.overview.title}
            onChange={(v) => patch({ overview: { ...d.overview, title: v } })}
          />
          <Field
            label="Paragraph 1"
            area
            value={d.overview.body1}
            onChange={(v) => patch({ overview: { ...d.overview, body1: v } })}
          />
          <Field
            label="Paragraph 2"
            area
            value={d.overview.body2}
            onChange={(v) => patch({ overview: { ...d.overview, body2: v } })}
          />
          <Field
            label="Pull quote"
            area
            value={d.overview.quote}
            onChange={(v) => patch({ overview: { ...d.overview, quote: v } })}
          />
        </Card>

        <Card title="What to expect">
          <Repeater
            items={d.expect}
            onChange={(expect) => patch({ expect })}
            blank={{ eyebrow: "", title: "", body: "" }}
            render={(c, set) => (
              <div className="space-y-3">
                <Field
                  label="Eyebrow"
                  value={c.eyebrow ?? ""}
                  onChange={(v) => set({ ...c, eyebrow: v })}
                />
                <Field label="Title" value={c.title} onChange={(v) => set({ ...c, title: v })} />
                <Field label="Body" area value={c.body} onChange={(v) => set({ ...c, body: v })} />
              </div>
            )}
          />
        </Card>

        <Card title="Event information">
          <Field
            label="Intro note"
            area
            value={d.info.note}
            onChange={(v) => patch({ info: { ...d.info, note: v } })}
          />
          <StringList
            label="Hours"
            items={d.info.hours}
            onChange={(hours) => patch({ info: { ...d.info, hours } })}
          />
          <StringList
            label="Set-up information"
            items={d.info.setup}
            onChange={(setup) => patch({ info: { ...d.info, setup } })}
          />
          <Field
            label="Highlight title"
            value={d.info.overnight.title}
            onChange={(v) =>
              patch({ info: { ...d.info, overnight: { ...d.info.overnight, title: v } } })
            }
          />
          <Field
            label="Highlight body"
            area
            value={d.info.overnight.body}
            onChange={(v) =>
              patch({ info: { ...d.info, overnight: { ...d.info.overnight, body: v } } })
            }
          />
        </Card>

        <Card title="Booth pricing">
          <Field
            label="Eyebrow"
            value={d.pricing.eyebrow}
            onChange={(v) => patch({ pricing: { ...d.pricing, eyebrow: v } })}
          />
          <Field
            label="Title"
            value={d.pricing.title}
            onChange={(v) => patch({ pricing: { ...d.pricing, title: v } })}
          />
          <Field
            label="Subtitle"
            area
            value={d.pricing.subtitle}
            onChange={(v) => patch({ pricing: { ...d.pricing, subtitle: v } })}
          />
          <Field
            label="Footnote"
            area
            value={d.pricing.note}
            onChange={(v) => patch({ pricing: { ...d.pricing, note: v } })}
          />
          <Repeater
            items={d.pricing.tiers}
            onChange={(tiers) => patch({ pricing: { ...d.pricing, tiers } })}
            blank={{ name: "", price: "", unit: "", featured: false, features: [] }}
            render={(t, set) => (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Name" value={t.name} onChange={(v) => set({ ...t, name: v })} />
                  <Field label="Price" value={t.price} onChange={(v) => set({ ...t, price: v })} />
                  <Field label="Unit" value={t.unit} onChange={(v) => set({ ...t, unit: v })} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={t.featured}
                    onCheckedChange={(c) => set({ ...t, featured: c })}
                    id={`feat-${t.name}`}
                  />
                  <Label htmlFor={`feat-${t.name}`}>Highlight as most popular</Label>
                </div>
                <StringList
                  label="Included"
                  items={t.features}
                  onChange={(features) => set({ ...t, features })}
                />
              </div>
            )}
          />
        </Card>

        <Card title="Policies & requirements">
          <Repeater
            items={d.policies}
            onChange={(policies) => patch({ policies })}
            blank={{ title: "", items: [] }}
            render={(g, set) => (
              <div className="space-y-3">
                <Field label="Group title" value={g.title} onChange={(v) => set({ ...g, title: v })} />
                <StringList label="Points" items={g.items} onChange={(items) => set({ ...g, items })} />
              </div>
            )}
          />
        </Card>

        <Card title="Vendor selection steps">
          <Repeater
            items={d.selection}
            onChange={(selection) => patch({ selection })}
            blank={{ title: "", body: "" }}
            render={(c, set) => (
              <div className="space-y-3">
                <Field label="Title" value={c.title} onChange={(v) => set({ ...c, title: v })} />
                <Field label="Body" area value={c.body} onChange={(v) => set({ ...c, body: v })} />
              </div>
            )}
          />
        </Card>

        <Card title="Vendor call-out">
          <Field
            label="Eyebrow"
            value={d.vendor_call.eyebrow}
            onChange={(v) => patch({ vendor_call: { ...d.vendor_call, eyebrow: v } })}
          />
          <Field
            label="Title"
            value={d.vendor_call.title}
            onChange={(v) => patch({ vendor_call: { ...d.vendor_call, title: v } })}
          />
          <Field
            label="Body"
            area
            value={d.vendor_call.body}
            onChange={(v) => patch({ vendor_call: { ...d.vendor_call, body: v } })}
          />
          <StringList
            label="Perks"
            items={d.vendor_call.perks}
            onChange={(perks) => patch({ vendor_call: { ...d.vendor_call, perks } })}
          />
          <StringList
            label="Vendor categories"
            items={d.categories}
            onChange={(categories) => patch({ categories })}
          />
        </Card>

        <Card title="Application block">
          <Field
            label="Title"
            value={d.apply.title}
            onChange={(v) => patch({ apply: { ...d.apply, title: v } })}
          />
          <StringList
            label="Steps"
            items={d.apply.steps}
            onChange={(steps) => patch({ apply: { ...d.apply, steps } })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              value={d.apply.email}
              onChange={(v) => patch({ apply: { ...d.apply, email: v } })}
            />
            <Field
              label="Phone"
              value={d.apply.phone}
              onChange={(v) => patch({ apply: { ...d.apply, phone: v } })}
            />
          </div>
          <Field
            label="Note"
            area
            value={d.apply.note}
            onChange={(v) => patch({ apply: { ...d.apply, note: v } })}
          />
          <Field
            label="Closing line"
            area
            value={d.apply.closing}
            onChange={(v) => patch({ apply: { ...d.apply, closing: v } })}
          />
          <FormPicker
            value={d.apply.form_slug}
            onChange={(v) => patch({ apply: { ...d.apply, form_slug: v } })}
          />
        </Card>

        <Card title="Footer">
          <Field label="Blurb" area value={d.footer.blurb} onChange={(v) => patch({ footer: { ...d.footer, blurb: v } })} />
          <Field label="Address" value={d.footer.address} onChange={(v) => patch({ footer: { ...d.footer, address: v } })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" value={d.footer.email} onChange={(v) => patch({ footer: { ...d.footer, email: v } })} />
            <Field label="Phone" value={d.footer.phone} onChange={(v) => patch({ footer: { ...d.footer, phone: v } })} />
          </div>
          <Repeater
            items={d.footer.socials}
            onChange={(socials) => patch({ footer: { ...d.footer, socials } })}
            blank={{ label: "", url: "" }}
            render={(s, set) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Label" value={s.label} onChange={(v) => set({ ...s, label: v })} />
                <Field label="URL" value={s.url} onChange={(v) => set({ ...s, url: v })} />
              </div>
            )}
          />
          <Field
            label="Copyright"
            value={d.footer.copyright}
            onChange={(v) => patch({ footer: { ...d.footer, copyright: v } })}
          />
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={() => save.mutate(d)} disabled={!isAdmin || save.isPending}>
            <Save className="size-4" /> {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {area ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function ImageField({
  label,
  value,
  busy,
  square,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  busy: boolean;
  square?: boolean;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
}) {
  const inputId = `image-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img
            src={value}
            alt={`${label} preview`}
            className={square ? "size-16 rounded-md border object-contain" : "h-20 w-32 rounded-md border object-cover"}
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={value}
            placeholder="Upload an image or paste a complete https:// URL"
            onChange={(event) => onChange(event.target.value)}
          />
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
          <Button asChild type="button" variant="outline" size="sm" disabled={busy}>
            <label htmlFor={inputId} className="cursor-pointer">
              <ImageUp className="size-4" /> {busy ? "Uploading…" : "Upload image"}
            </label>
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Stored securely and served through this website, so it works on Lovable and Vercel domains.
      </p>
    </div>
  );
}

function StringList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={it}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="size-4" /> Add
      </Button>
    </div>
  );
}

function Repeater<T>({
  items,
  onChange,
  blank,
  render,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  blank: T;
  render: (item: T, set: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="relative rounded-lg border bg-surface p-4">
          {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-destructive"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, { ...blank }])}>
        <Plus className="size-4" /> Add item
      </Button>
    </div>
  );
}

function FormPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: forms = [] } = useQuery({
    queryKey: ["published-forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("title,slug,is_published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        Vendor application form (used by the “Apply online” button)
      </Label>
      <select
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Latest published form</option>
        {forms.map((f) => (
          <option key={f.slug} value={f.slug}>
            {f.title} {f.is_published ? "" : "(draft — not visible)"}
          </option>
        ))}
      </select>
    </div>
  );
}
