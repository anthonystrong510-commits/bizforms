import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, BarChart3, Copy, Eye, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QUESTION_TYPES,
  THEMES,
  themeClass,
  parseSections,
  formLinks,
  type FormSection,
  type QuestionType,
} from "@/lib/forms";
import type { TablesUpdate } from "@/integrations/supabase/types";

export const Route = createFileRoute("/forms/$id/")({
  head: () => ({
    meta: [
      { title: "Form builder — Formcraft" },
      { name: "description", content: "Edit questions, styling and sharing options for your form." },
      { property: "og:title", content: "Form builder — Formcraft" },
      { property: "og:description", content: "Edit questions, styling and sharing options." },
    ],
  }),
  component: Builder,
});

type Question = {
  id: string;
  type: string;
  title: string;
  description: string;
  options: unknown;
  required: boolean;
  position: number;
  section: number;
};


function Builder() {
  const { id } = Route.useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: form } = useQuery({
    queryKey: ["form", id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("forms").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["questions", id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("form_id", id)
        .order("position");
      if (error) throw error;
      return data as Question[];
    },
  });

  const patchForm = useMutation({
    mutationFn: async (patch: TablesUpdate<"forms">) => {
      const { error } = await supabase.from("forms").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const patchQuestion = useMutation({
    mutationFn: async ({ qid, patch }: { qid: string; patch: TablesUpdate<"questions"> }) => {
      const { error } = await supabase.from("questions").update(patch).eq("id", qid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addQuestion = useMutation({
    mutationFn: async (type: QuestionType) => {
      const { error } = await supabase.from("questions").insert({
        form_id: id,
        type,
        title: "",
        options: ["choice", "checkbox", "dropdown"].includes(type) ? ["Option 1", "Option 2"] : [],
        position: questions.length,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (qid: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", qid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const a = questions[index];
      const b = questions[index + dir];
      if (!a || !b) return;
      await supabase.from("questions").update({ position: b.position }).eq("id", a.id);
      await supabase.from("questions").update({ position: a.position }).eq("id", b.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", id] }),
  });

  if (!form) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <p className="p-10 text-sm text-muted-foreground">Loading form…</p>
      </div>
    );
  }

  const declared = parseSections(form.sections);
  const maxSection = questions.reduce((m, q) => Math.max(m, q.section ?? 0), 0);
  const sections: FormSection[] = Array.from(
    { length: Math.max(declared.length, maxSection + 1, 1) },
    (_, i) => declared[i] ?? { title: "", description: "" },
  );

  const { long: longLink, short: shortLink } = formLinks(form.slug, form.short_code);


  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title={form.title} />

      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
          <Badge variant={form.is_published ? "default" : "secondary"}>
            {form.is_published ? "Published" : "Draft"}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/form/$slug" params={{ slug: form.slug }} target="_blank">
                <Eye className="size-4" /> Preview
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/forms/$id/responses" params={{ id }}>
                <BarChart3 className="size-4" /> Responses
              </Link>
            </Button>
            <Button
              size="sm"
              disabled={!isAdmin}
              onClick={() => patchForm.mutate({ is_published: !form.is_published })}
            >
              {form.is_published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className={`${themeClass(form.theme)} h-24`} />
          <div className="space-y-4 p-6">
            <Input
              className="!text-2xl h-auto border-0 px-0 font-display font-bold shadow-none focus-visible:ring-0"
              defaultValue={form.title}
              disabled={!isAdmin}
              onBlur={(e) => e.target.value !== form.title && patchForm.mutate({ title: e.target.value })}
            />
            <Textarea
              className="min-h-20 border-0 px-0 shadow-none focus-visible:ring-0"
              placeholder="Form description — event details, pricing, set-up information…"
              defaultValue={form.description}
              disabled={!isAdmin}
              onBlur={(e) =>
                e.target.value !== form.description && patchForm.mutate({ description: e.target.value })
              }
            />
            <div className="flex flex-wrap items-center gap-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    aria-label={t.label}
                    disabled={!isAdmin}
                    onClick={() => patchForm.mutate({ theme: t.value })}
                    className={`${t.className} size-6 rounded-full ring-offset-2 ${
                      form.theme === t.value ? "ring-2 ring-ring" : ""
                    }`}
                  />
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Switch
                  id="accepting"
                  checked={form.accepting_responses}
                  disabled={!isAdmin}
                  onCheckedChange={(v) => patchForm.mutate({ accepting_responses: v })}
                />
                <Label htmlFor="accepting" className="text-sm">
                  Accepting responses
                </Label>
              </div>
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-[1fr_200px]">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Background image URL</Label>
                <Input
                  placeholder="https://…/flyer.jpg"
                  defaultValue={form.background_image_url ?? ""}
                  disabled={!isAdmin}
                  onBlur={(e) =>
                    e.target.value !== (form.background_image_url ?? "") &&
                    patchForm.mutate({ background_image_url: e.target.value || null })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Shown behind the form and on the start card — it blends automatically with your theme.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Background blend ({Math.round(Number(form.background_dim ?? 0.55) * 100)}%)
                </Label>
                <input
                  type="range"
                  min={0}
                  max={95}
                  step={5}
                  className="w-full accent-[var(--primary)]"
                  disabled={!isAdmin}
                  defaultValue={Math.round(Number(form.background_dim ?? 0.55) * 100)}
                  onMouseUp={(e) =>
                    patchForm.mutate({ background_dim: Number(e.currentTarget.value) / 100 })
                  }
                  onTouchEnd={(e) =>
                    patchForm.mutate({ background_dim: Number(e.currentTarget.value) / 100 })
                  }
                />
                {form.background_image_url ? (
                  <img
                    src={form.background_image_url}
                    alt="Form background preview"
                    className="h-16 w-full rounded-md object-cover"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold">Sections</h3>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              disabled={!isAdmin}
              onClick={() =>
                patchForm.mutate({
                  sections: [...sections, { title: `Section ${sections.length + 1}`, description: "" }] as never,
                })
              }
            >
              <Plus className="size-3.5" /> Add section
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Respondents move through one section per page with Next, then Submit at the end.
          </p>
          <div className="mt-4 space-y-3">
            {sections.map((s, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="w-16 text-sm font-semibold text-muted-foreground">{i + 1}.</span>
                <Input
                  className="flex-1"
                  placeholder="Section title"
                  defaultValue={s.title}
                  disabled={!isAdmin}
                  onBlur={(e) => {
                    const next = sections.map((x, j) =>
                      j === i ? { ...x, title: e.target.value } : x,
                    );
                    patchForm.mutate({ sections: next as never });
                  }}
                />
                <Input
                  className="flex-1"
                  placeholder="Section description (optional)"
                  defaultValue={s.description}
                  disabled={!isAdmin}
                  onBlur={(e) => {
                    const next = sections.map((x, j) =>
                      j === i ? { ...x, description: e.target.value } : x,
                    );
                    patchForm.mutate({ sections: next as never });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={!isAdmin || sections.length <= 1}
                  onClick={() => patchForm.mutate({ sections: sections.filter((_, j) => j !== i) as never })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>


        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Questions are grouped into the section chosen on each card.
          </p>

          {questions.map((q, index) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={index}
              total={questions.length}
              disabled={!isAdmin}
              onPatch={(patch) => patchQuestion.mutate({ qid: q.id, patch })}
              onDelete={() => deleteQuestion.mutate(q.id)}
              onMove={(dir) => move.mutate({ index, dir })}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-4">
          <span className="text-sm text-muted-foreground">Add question</span>
          {QUESTION_TYPES.map((t) => (
            <Button
              key={t.value}
              size="sm"
              variant="outline"
              disabled={!isAdmin}
              onClick={() => addQuestion.mutate(t.value)}
            >
              <Plus className="size-3.5" /> {t.label}
            </Button>
          ))}
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h3 className="font-display font-bold">Share</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.is_published
              ? "Both links are live and point to the same form."
              : "Publish the form to make these links work for respondents."}
          </p>
          <div className="mt-4 space-y-3">
            <CopyRow label="Full link" value={longLink} />
            <CopyRow label="Short link" value={shortLink} />
          </div>
        </div>
      </main>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
        >
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  index,
  total,
  disabled,
  onPatch,
  onDelete,
  onMove,
}: {
  q: Question;
  index: number;
  total: number;
  disabled: boolean;
  onPatch: (patch: TablesUpdate<"questions">) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const initialOptions = Array.isArray(q.options) ? (q.options as string[]) : [];
  const [options, setOptions] = useState<string[]>(initialOptions);
  const hasOptions = ["choice", "checkbox", "dropdown"].includes(q.type);

  useEffect(() => {
    setOptions(Array.isArray(q.options) ? (q.options as string[]) : []);
  }, [q.options]);

  function saveOptions(next: string[]) {
    setOptions(next);
    onPatch({ options: next });
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="mt-2 text-sm font-semibold text-muted-foreground">{index + 1}.</span>
        <div className="flex-1 space-y-3">
          <Input
            placeholder="Question title"
            defaultValue={q.title}
            disabled={disabled}
            onBlur={(e) => e.target.value !== q.title && onPatch({ title: e.target.value })}
          />
          <Input
            placeholder="Helper text (optional)"
            className="text-sm"
            defaultValue={q.description}
            disabled={disabled}
            onBlur={(e) => e.target.value !== q.description && onPatch({ description: e.target.value })}
          />

          {hasOptions ? (
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={opt}
                    disabled={disabled}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    onBlur={() => onPatch({ options })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    onClick={() => saveOptions(options.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => saveOptions([...options, `Option ${options.length + 1}`])}
              >
                <Plus className="size-3.5" /> Add option
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Select value={q.type} disabled={disabled} onValueChange={(v) => onPatch({ type: v })}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(q.section ?? 0)}
              disabled={disabled}
              onValueChange={(v) => onPatch({ section: Number(v) })}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: sectionCount }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    Section {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id={`req-${q.id}`}
                checked={q.required}
                disabled={disabled}
                onCheckedChange={(v) => onPatch({ required: v })}
              />
              <Label htmlFor={`req-${q.id}`} className="text-sm">
                Required
              </Label>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" disabled={disabled || index === 0} onClick={() => onMove(-1)}>
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled || index === total - 1}
                onClick={() => onMove(1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" disabled={disabled} onClick={onDelete}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
