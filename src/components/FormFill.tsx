import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, Mail, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { themeClass, parseSections, isContentBlock, type FormSection } from "@/lib/forms";
import { RichText } from "@/components/RichText";
import { useSite } from "@/lib/site";

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

export function FormFill({ by, value }: { by: "slug" | "short_code"; value: string }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [phase, setPhase] = useState<"start" | "filling" | "done">("start");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<number | null>(null);
  const { data: site } = useSite();
  const followUpEmail = site?.apply.email || site?.footer.email || "hello@example.com";
  const followUpPhone = site?.apply.phone || site?.footer.phone || "";



  const { data, isLoading, error } = useQuery({
    queryKey: ["public-form", by, value],
    queryFn: async () => {
      const { data: form, error: fErr } = await supabase
        .from("forms")
        .select(
          "id,title,description,theme,accepting_responses,confirmation_message,sections,background_image_url,background_dim",
        )
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
      return { form, questions: (questions ?? []) as Question[] };
    },
  });

  useEffect(() => {
    if (error) toast.error("Could not load this form");
  }, [error]);

  const questions = useMemo(() => data?.questions ?? [], [data]);

  const sections: FormSection[] = useMemo(() => {
    const declared = parseSections(data?.form?.sections);
    const maxIndex = questions.reduce((m, q) => Math.max(m, q.section ?? 0), 0);
    const count = Math.max(declared.length, maxIndex + 1, 1);
    return Array.from({ length: count }, (_, i) => declared[i] ?? { title: "", description: "" });
  }, [data, questions]);

  const grouped = useMemo(
    () => sections.map((_, i) => questions.filter((q) => (q.section ?? 0) === i)),
    [sections, questions],
  );

  if (isLoading) return <CenteredNote>Loading form…</CenteredNote>;
  if (!data) {
    return <CenteredNote>This form doesn’t exist, or it hasn’t been published yet.</CenteredNote>;
  }

  const { form } = data;
  const bg = form.background_image_url;
  const dim = Number(form.background_dim ?? 0.55);

  const set = (id: string, v: string | string[]) => setAnswers((prev) => ({ ...prev, [id]: v }));

  function validate(list: Question[]) {
    for (const q of list) {
      const a = answers[q.id];
      if (q.required && (a === undefined || a === "" || (Array.isArray(a) && a.length === 0))) {
        toast.error(`"${q.title || "Untitled question"}" is required`);
        return false;
      }
    }
    return true;
  }

  async function submit() {
    if (!validate(grouped[step] ?? [])) return;
    setBusy(true);
    const payload = questions
      .filter((q) => {
        const a = answers[q.id];
        return a !== undefined && a !== "" && !(Array.isArray(a) && a.length === 0);
      })
      .map((q) => ({ question_id: q.id, value: answers[q.id] }));

    const { data: seq, error: sErr } = await supabase.rpc("submit_response", {
      p_form_id: form.id,
      p_answers: payload as never,
    });
    setBusy(false);
    if (sErr) {
      toast.error(sErr.message || "Could not submit your response");
      return;
    }
    setTicket(typeof seq === "number" ? seq : null);
    setPhase("done");
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="relative min-h-screen bg-surface">
      {bg ? (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bg})` }}
            aria-hidden
          />
          <div
            className="fixed inset-0 backdrop-blur-[2px]"
            style={{
              backgroundColor: `color-mix(in oklab, var(--background) ${Math.round(dim * 100)}%, transparent)`,
            }}
            aria-hidden
          />
        </>
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );

  if (phase === "done") {
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-lift">
            <div className={`${themeClass(form.theme)} h-3`} />
            <div className="p-10 text-center">
              <CheckCircle2 className="mx-auto size-10 text-primary" />
              <h1 className="mt-4 font-display text-2xl font-bold">{form.title}</h1>
              <p className="mt-2 text-muted-foreground">{form.confirmation_message}</p>
              {ticket ? (
                <p className="mt-4 text-sm">
                  Your submission number is{" "}
                  <span className="font-display text-lg font-bold text-primary">#{ticket}</span>
                </p>
              ) : null}
              <div className="mt-6 rounded-xl border bg-muted/40 p-5 text-left">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step 03 — Approval
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Approved vendors will be contacted with payment instructions and booth
                  assignment. For any follow-up, quote your submission number and write to:
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  <a
                    href={`mailto:${followUpEmail}?subject=${encodeURIComponent(
                      `Application ${ticket ? `#${ticket}` : ""} — ${form.title}`,
                    )}`}
                    className="text-sm font-semibold text-primary underline underline-offset-4"
                  >
                    {followUpEmail}
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => {
                      navigator.clipboard?.writeText(followUpEmail);
                      toast.success("Email copied");
                    }}
                  >
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </div>
                {followUpPhone ? (
                  <p className="mt-3 text-xs text-muted-foreground">Or call {followUpPhone}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "start") {
    const totalQuestions = questions.length;
    const minutes = Math.max(1, Math.round(totalQuestions * 0.4));
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-card shadow-lift">
            {bg ? (
              <img src={bg} alt={`${form.title} cover`} className="h-28 w-full object-cover" />
            ) : (
              <div className={`${themeClass(form.theme)} h-20`} />
            )}
            <div className="flex flex-col items-center gap-4 px-7 py-8 text-center">
              <h1 className="font-display text-2xl font-extrabold text-primary">{form.title}</h1>
              {form.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{form.description}</p>
              ) : null}
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border px-3 py-1">
                  {sections.length} section{sections.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border px-3 py-1">{totalQuestions} questions</span>
                <span className="rounded-full border px-3 py-1">~{minutes} min</span>
              </div>
              {form.accepting_responses ? (
                <Button size="lg" className="mt-1 w-full" onClick={() => setPhase("filling")}>
                  Start now
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This form is no longer accepting responses.
                </p>
              )}
            </div>
          </div>
        </div>
      </Shell>
    );
  }


  const current = grouped[step] ?? [];
  const last = step === sections.length - 1;

  return (
    <Shell>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className={`${themeClass(form.theme)} h-3`} />
          <div className="p-5">
            <h1 className="font-display text-xl font-bold text-primary">{form.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={((step + 1) / sections.length) * 100} className="h-1.5" />
              <span className="shrink-0 text-xs text-muted-foreground">
                Section {step + 1} of {sections.length}
              </span>
            </div>
          </div>
        </div>

        {sections[step]?.title || sections[step]?.description ? (
          <div className="rounded-xl border bg-card p-5 shadow-card">
            {sections[step]?.title ? (
              <h2 className="font-display text-lg font-bold">{sections[step].title}</h2>
            ) : null}
            {sections[step]?.description ? (
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {sections[step].description}
              </p>
            ) : null}
          </div>
        ) : null}

        {current.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-card">
            No questions in this section.
          </div>
        ) : null}

        {current.map((q, i) => {
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
                    type={
                      q.type === "date"
                        ? "date"
                        : q.type === "number"
                          ? "number"
                          : q.type === "email"
                            ? "email"
                            : "text"
                    }
                    value={(val as string) ?? ""}
                    onChange={(e) => set(q.id, e.target.value)}
                    placeholder="Enter your answer"
                  />
                )}
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3 pb-12">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div className="ml-auto">
            {last ? (
              <Button type="button" size="lg" disabled={busy} onClick={submit}>
                {busy ? "Submitting…" : "Submit"}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  if (validate(current)) setStep((s) => s + 1);
                }}
              >
                Next <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <p className="max-w-sm text-center text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
