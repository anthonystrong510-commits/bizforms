import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, FileText, Plus, Search, Trash2, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { randomCode, slugify, themeClass } from "@/lib/forms";
import { TEMPLATES, type FormTemplate } from "@/lib/templates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Formcraft — Build beautiful forms and share short links" },
      {
        name: "description",
        content:
          "Admin dashboard to build forms, publish shareable links, shorten them and review every response.",
      },
      { property: "og:title", content: "Formcraft — Build beautiful forms" },
      {
        property: "og:description",
        content: "Build forms, publish shareable links, shorten them and review responses.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["forms"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("id,title,description,theme,slug,short_code,is_published,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["response-counts", forms.map((f) => f.id).join(",")],
    enabled: isAdmin && forms.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("responses").select("form_id");
      if (error) throw error;
      return data.reduce<Record<string, number>>((acc, r) => {
        acc[r.form_id] = (acc[r.form_id] ?? 0) + 1;
        return acc;
      }, {});
    },
  });

  const create = useMutation({
    mutationFn: async (tpl: FormTemplate) => {
      if (!user) throw new Error("Not signed in");
      const { data: form, error } = await supabase
        .from("forms")
        .insert({
          owner_id: user.id,
          title: tpl.title,
          description: tpl.description,
          theme: tpl.theme,
          slug: slugify(tpl.title),
          short_code: randomCode(7),
        })
        .select()
        .single();
      if (error) throw error;
      if (tpl.questions.length) {
        const { error: qErr } = await supabase.from("questions").insert(
          tpl.questions.map((q, i) => ({
            form_id: form.id,
            type: q.type,
            title: q.title,
            description: q.description ?? "",
            options: q.options ?? [],
            required: q.required ?? false,
            position: i,
          })),
        );
        if (qErr) throw qErr;
      }
      return form;
    },
    onSuccess: (form) => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      navigate({ to: "/forms/$id", params: { id: form.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Form deleted");
      qc.invalidateQueries({ queryKey: ["forms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = forms.filter((f) => f.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <section className="border-b bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => create.mutate(TEMPLATES[0])} disabled={!isAdmin || create.isPending}>
              <Plus className="size-4" /> New form
            </Button>
            <Button
              variant="outline"
              onClick={() => create.mutate(TEMPLATES[5])}
              disabled={!isAdmin || create.isPending}
            >
              New quiz
            </Button>
            {!isAdmin && !loading ? (
              <Badge variant="secondary">Read-only — admin access required to create forms</Badge>
            ) : null}
          </div>

          <h2 className="mt-10 font-display text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Explore templates
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {TEMPLATES.slice(1).map((tpl) => (
              <button
                key={tpl.id}
                disabled={!isAdmin || create.isPending}
                onClick={() => create.mutate(tpl)}
                className="group overflow-hidden rounded-xl border bg-card text-left shadow-card transition hover:shadow-lift disabled:opacity-60"
              >
                <div className={`${tpl.bannerClass} relative h-28 p-4`}>
                  <span className="font-display text-base font-bold text-primary-foreground">{tpl.name}</span>
                  <div className="absolute -bottom-6 left-6 h-16 w-[78%] rounded-t-md bg-card/95 shadow-lift transition group-hover:-translate-y-1">
                    <div className="space-y-2 p-3">
                      <div className="h-1.5 w-3/4 rounded bg-muted" />
                      <div className="h-1.5 w-1/2 rounded bg-muted" />
                      <div className="h-1.5 w-2/3 rounded bg-muted" />
                    </div>
                  </div>
                </div>
                <p className="px-4 pt-8 pb-4 text-xs text-muted-foreground">{tpl.blurb}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg font-bold">Your forms</h2>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Filter by keyword"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed p-12 text-center">
            <FileText className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No forms yet. Pick a template above to get started.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((form) => (
              <div key={form.id} className="overflow-hidden rounded-xl border bg-card shadow-card">
                <Link to="/forms/$id" params={{ id: form.id }}>
                  <div className={`${themeClass(form.theme)} h-24`} />
                </Link>
                <div className="space-y-2 p-4">
                  <Link
                    to="/forms/$id"
                    params={{ id: form.id }}
                    className="line-clamp-1 font-display font-semibold hover:underline"
                  >
                    {form.title}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={form.is_published ? "default" : "secondary"}>
                      {form.is_published ? "Published" : "Draft"}
                    </Badge>
                    <span>{counts[form.id] ?? 0} responses</span>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/forms/$id/responses" params={{ id: form.id }}>
                        <BarChart3 className="size-4" /> Results
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/f/${form.short_code}`);
                        toast.success("Short link copied");
                      }}
                    >
                      <Link2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-destructive"
                      onClick={() => remove.mutate(form.id)}
                      disabled={!isAdmin}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
