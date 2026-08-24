import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/forms/$id/responses/")({
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
  const [numberFilter, setNumberFilter] = useState("");
  const [field, setField] = useState("all");

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
          supabase.from("questions").select("id,title,position,type").eq("form_id", id).order("position"),
          supabase
            .from("responses")
            .select("id,seq,submitted_at")
            .eq("form_id", id)
            .order("submitted_at", { ascending: false }),
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
    return data.responses.map((r, i) => ({
      id: r.id,
      seq: r.seq ?? data.responses.length - i,
      submitted_at: r.submitted_at,
      values: byResponse.get(r.id) ?? {},
    }));
  }, [data]);

  const visible = useMemo(() => {
    const n = numberFilter.trim();
    if (!n) return table;
    return table.filter((r) => String(r.seq).includes(n));
  }, [table, numberFilter]);

  const columns = useMemo(() => {
    if (!data) return [];
    return field === "all" ? data.questions : data.questions.filter((q) => q.id === field);
  }, [data, field]);

  function exportCsv() {
    if (!data) return;
    const header = ["#", "Submitted at", ...columns.map((q) => q.title || "Untitled")];
    const rows = visible.map((r) => [
      `#${r.seq}`,
      new Date(r.submitted_at).toLocaleString(),
      ...columns.map((q) => r.values[q.id] ?? ""),
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

        <div className="grid gap-4 rounded-xl border bg-card p-4 shadow-card sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Find by response number</Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                inputMode="numeric"
                placeholder="e.g. 12"
                value={numberFilter}
                onChange={(e) => setNumberFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Show</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All answers</SelectItem>
                {data?.questions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title || "Untitled"} only
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3 font-semibold">#</th>
                <th className="p-3 font-semibold">Submitted</th>
                {columns.map((q) => (
                  <th key={q.id} className="p-3 font-semibold whitespace-nowrap">
                    {q.title || "Untitled"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={columns.length + 2}>
                    {table.length === 0
                      ? "No responses yet. Share your link to start collecting."
                      : "No response matches that number."}
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3">
                      <Link
                        to="/forms/$id/responses/$seq"
                        params={{ id, seq: String(r.seq) }}
                        className="font-semibold text-primary hover:underline"
                      >
                        #{r.seq}
                      </Link>
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {new Date(r.submitted_at).toLocaleString()}
                    </td>
                    {columns.map((q) => (
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
