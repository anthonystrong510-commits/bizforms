import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/attendees")({
  head: () => ({
    meta: [
      { title: "Guest list — Market Fest admin" },
      { name: "description", content: "Attendee names and emails collected from the event site." },
      { property: "og:title", content: "Guest list — Market Fest admin" },
      { property: "og:description", content: "Manage and export attendee sign-ups." },
    ],
  }),
  component: AttendeesPage,
});

type Attendee = { id: string; name: string; email: string; created_at: string };

function AttendeesPage() {
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["attendees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendees")
        .select("id,name,email,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Attendee[];
    },
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = data ?? [];
    if (!term) return list;
    return list.filter(
      (a) => a.name.toLowerCase().includes(term) || a.email.toLowerCase().includes(term),
    );
  }, [data, q]);

  function exportCsv() {
    const header = "name,email,joined\n";
    const body = rows
      .map((r) => [r.name, r.email, new Date(r.created_at).toISOString()].map(csv).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendees.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Guest list</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${rows.length} attendee${rows.length === 1 ? "" : "s"}`}{" "}
              signed up from the event site.
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-card">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <Users className="size-8" />
              No attendees yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{a.name || "—"}</td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${a.email}`} className="text-primary underline-offset-4 hover:underline">
                        {a.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

function csv(v: string) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}
