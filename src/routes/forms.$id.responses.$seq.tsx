import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/forms/$id/responses/$seq")({
  head: () => ({
    meta: [
      { title: "Individual response — Formcraft" },
      { name: "description", content: "View a single submission by its response number." },
      { property: "og:title", content: "Individual response — Formcraft" },
      { property: "og:description", content: "View a single submission by its response number." },
    ],
  }),
  component: SingleResponse,
});

function SingleResponse() {
  const { id, seq } = Route.useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [lookup, setLookup] = useState(seq);

  useEffect(() => setLookup(seq), [seq]);
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["response", id, seq],
    enabled: Boolean(user),
    queryFn: async () => {
      const [{ data: form }, { data: questions }, { data: response }, { count }] = await Promise.all([
        supabase.from("forms").select("title").eq("id", id).single(),
        supabase.from("questions").select("id,title,position,section").eq("form_id", id).order("position"),
        supabase
          .from("responses")
          .select("id,seq,submitted_at")
          .eq("form_id", id)
          .eq("seq", Number(seq))
          .maybeSingle(),
        supabase.from("responses").select("id", { count: "exact", head: true }).eq("form_id", id),
      ]);
      let answers: { question_id: string; value: unknown }[] = [];
      if (response) {
        const { data: rows } = await supabase
          .from("answers")
          .select("question_id,value")
          .eq("response_id", response.id);
        answers = rows ?? [];
      }
      return { form, questions: questions ?? [], response, answers, total: count ?? 0 };
    },
  });

  const values = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of data?.answers ?? []) {
      map[a.question_id] = Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "");
    }
    return map;
  }, [data]);

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <p className="p-10 text-sm text-muted-foreground">Only admins can view responses.</p>
      </div>
    );
  }

  const n = Number(seq);
  const go = (target: number) =>
    navigate({ to: "/forms/$id/responses/$seq", params: { id, seq: String(target) } });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={data?.form?.title} />
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/forms/$id/responses" params={{ id }}>
              <ArrowLeft className="size-4" /> All responses
            </Link>
          </Button>
          <Badge variant="secondary">
            Response #{seq}
            {data?.total ? ` of ${data.total}` : ""}
          </Badge>
          <form
            className="ml-auto flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = Number(lookup);
              if (Number.isFinite(v) && v > 0) go(v);
            }}
          >
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-36 pl-9"
                inputMode="numeric"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="Response no."
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              View
            </Button>
          </form>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.response ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No response numbered #{seq} for this form.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-card">
            <div className="border-b bg-surface px-6 py-4">
              <p className="font-display text-lg font-bold">Response #{data.response.seq ?? seq}</p>
              <p className="text-sm text-muted-foreground">
                Submitted {new Date(data.response.submitted_at).toLocaleString()}
              </p>
            </div>
            <dl className="divide-y">
              {data.questions.map((q, i) => (
                <div key={q.id} className="px-6 py-4">
                  <dt className="text-sm font-semibold">
                    {i + 1}. {q.title || "Untitled question"}
                  </dt>
                  <dd className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                    {values[q.id] || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={n <= 1} onClick={() => go(n - 1)}>
            <ArrowLeft className="size-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={Boolean(data?.total) && n >= (data?.total ?? 0)}
            onClick={() => go(n + 1)}
          >
            Next <ArrowRight className="size-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
