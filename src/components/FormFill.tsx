import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { themeClass } from "@/lib/forms";

type Question = {
  id: string;
  type: string;
  title: string;
  description: string;
  options: unknown;
  required: boolean;
  position: number;
};

export function FormFill({ by, value }: { by: "slug" | "short_code"; value: string }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-form", by, value],
    queryFn: async () => {
      const { data: form, error: fErr } = await supabase
        .from("forms")
        .select("id,title,description,theme,accepting_responses,confirmation_message")
        .eq(by, value)
        .maybeSingle();
      if (fErr) throw fErr;
      if (!form) return null;
      const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("form_id", form.id)
        .order("position");
      if (qErr) throw qErr;
      return { form, questions: questions as Question[] };
    },
  });

  useEffect(() => {
    if (error) toast.error("Could not load this form");
  }, [error]);

  const questions = useMemo(() => data?.questions ?? [], [data]);

  if (isLoading) {
    return <CenteredNote>Loading form…</CenteredNote>;
  }
  if (!data) {
    return <CenteredNote>This form doesn’t exist, or it hasn’t been published yet.</CenteredNote>;
  }

  const { form } = data;

  if (done) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border bg-card shadow-card">
          <div className={`${themeClass(form.theme)} h-3`} />
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h1 className="mt-4 font-display text-2xl font-bold">{form.title}</h1>
            <p className="mt-2 text-muted-foreground">{form.confirmation_message}</p>
          </div>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    for (const q of questions) {
      const a = answers[q.id];
      if (q.required && (a === undefined || a === "" || (Array.isArray(a) && a.length === 0))) {
        toast.error(`"${q.title || "Untitled question"}" is required`);
        return;
      }
    }
    setBusy(true);
    const { data: response, error: rErr } = await supabase
      .from("responses")
      .insert({ form_id: form.id })
      .select("id")
      .single();
    if (rErr || !response) {
      setBusy(false);
      toast.error("Could not submit — the form may be closed.");
      return;
    }
    const rows = questions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
      .map((q) => ({ response_id: response.id, question_id: q.id, value: answers[q.id] as never }));
    if (rows.length) {
      const { error: aErr } = await supabase.from("answers").insert(rows);
      if (aErr) {
        setBusy(false);
        toast.error("Could not save your answers");
        return;
      }
    }
    setBusy(false);
    setDone(true);
  }

  const set = (id: string, v: string | string[]) => setAnswers((prev) => ({ ...prev, [id]: v }));

  return (
    <div className="min-h-screen bg-surface py-8">
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 px-4">
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className={`${themeClass(form.theme)} h-28`} />
          <div className="p-6">
            <h1 className="font-display text-3xl font-extrabold text-primary">{form.title}</h1>
            {form.description ? (
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{form.description}</p>
            ) : null}
          </div>
        </div>

        {!form.accepting_responses ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            This form is no longer accepting responses.
          </div>
        ) : (
          <>
            {questions.map((q, i) => {
              const options = Array.isArray(q.options) ? (q.options as string[]) : [];
              const val = answers[q.id];
              return (
                <div key={q.id} className="rounded-xl border bg-card p-6 shadow-card">
                  <Label className="text-base font-semibold">
                    {i + 1}. {q.title || "Untitled question"}
                    {q.required ? <span className="ml-1 text-destructive">*</span> : null}
                  </Label>
                  {q.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{q.description}</p>
                  ) : null}

                  <div className="mt-4">
                    {q.type === "long_text" ? (
                      <Textarea
                        value={(val as string) ?? ""}
                        onChange={(e) => set(q.id, e.target.value)}
                        placeholder="Enter your answer"
                      />
                    ) : q.type === "choice" ? (
                      <RadioGroup value={(val as string) ?? ""} onValueChange={(v) => set(q.id, v)}>
                        {options.map((o) => (
                          <div key={o} className="flex items-center gap-2">
                            <RadioGroupItem value={o} id={`${q.id}-${o}`} />
                            <Label htmlFor={`${q.id}-${o}`} className="font-normal">
                              {o}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : q.type === "checkbox" ? (
                      <div className="space-y-2">
                        {options.map((o) => {
                          const arr = Array.isArray(val) ? val : [];
                          return (
                            <div key={o} className="flex items-center gap-2">
                              <Checkbox
                                id={`${q.id}-${o}`}
                                checked={arr.includes(o)}
                                onCheckedChange={(c) =>
                                  set(q.id, c ? [...arr, o] : arr.filter((x) => x !== o))
                                }
                              />
                              <Label htmlFor={`${q.id}-${o}`} className="font-normal">
                                {o}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    ) : q.type === "dropdown" ? (
                      <Select value={(val as string) ?? ""} onValueChange={(v) => set(q.id, v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : q.type === "rating" ? (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-label={`${n} star`}
                            onClick={() => set(q.id, String(n))}
                            className="p-1"
                          >
                            <Star
                              className={`size-7 ${
                                Number(val) >= n ? "fill-primary text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Input
                        type={q.type === "date" ? "date" : q.type === "number" ? "number" : q.type === "email" ? "email" : "text"}
                        value={(val as string) ?? ""}
                        onChange={(e) => set(q.id, e.target.value)}
                        placeholder="Enter your answer"
                      />
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end pb-10">
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <p className="max-w-sm text-center text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
