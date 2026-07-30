import { useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/forms/$id/responses")({
  head: () => ({
    meta: [
      { title: "Responses — Formcraft" },
      { name: "description", content: "Review every response submitted to your form and export them." },
      { property: "og:title", content: "Responses — Formcraft" },
      { property: "og:description", content: "Review and export every response submitted to your form." },
    ],
  }),
  component: Responses,
});

type Question = { id: string; title: string; position: number };

function Responses() {
  const { id } = Route.useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data } = useQuery({
    queryKey: ["responses", id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [{ data: form }, { data: questions }, { data: responses }, { data: answers }] =
        await Promise.all([
          supabase.from("forms").select("title").eq("id", id).single(),
          supabase.from("questions").select("id,title,position").eq("form_id", id).order("position"),
          supabase.from("responses").select("id,submitted_at").eq("form_id", id).order("submitted_at", { ascending: false }),
          supabase.from("answers").select("response_id,question_id,value"),
        ]);
      return {
        form,
        questions: (questions ?? []) as Question[],
        responses: responses ?? [],
        answers: answers ?? [],
      };
    },
  });

  const table = useMemo(() => {
    if (!data) return [];
    const byResponse = new Map<string, Record<string, string>>();
    for (const a of data.answers) {
      const row = byResponse.get(a.response_id) ?? {};
      const v = a.value as unknown;
      row[a.question_id] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
      byResponse.set(a.response_id, row);
    }
    return data.responses.map((r) => ({
      id: r.id,
      submitted_at: r.submitted_at,
      values: byResponse.get(r.id) ?? {},
    }));
  }, [data]);

  function exportCsv() {
    if (!data) return;
    const header = ["Submitted at", ...data.questions.map((q) => q.title || "Untitled")];
    const rows = table.map((r) => [
      new Date(r.submitted_at).toLocaleString(),
      ...data.questions.map((q) => r.values[q.id] ?? ""),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.form?.title ?? "responses"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <p className="p-10 text-sm text-muted-foreground">Only admins can view responses.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={data?.form?.title} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/forms/$id" params={{ id }}>
              <ArrowLeft className="size-4" /> Back to questions
            </Link>
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Users className="size-3.5" /> {table.length} responses
          </Badge>
          <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3 font-semibold">Submitted</th>
                {data?.questions.map((q) => (
                  <th key={q.id} className="p-3 font-semibold whitespace-nowrap">
                    {q.title || "Untitled"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.length === 0 ? (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={(data?.questions.length ?? 0) + 1}>
                    No responses yet. Share your link to start collecting.
                  </td>
                </tr>
              ) : (
                table.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {new Date(r.submitted_at).toLocaleString()}
                    </td>
                    {data?.questions.map((q) => (
                      <td key={q.id} className="max-w-xs p-3">
                        {r.values[q.id] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
