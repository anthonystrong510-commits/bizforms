import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(1, "Please tell us your name").max(120, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255, "Email is too long"),
});

export function AttendeeSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("attendees").insert(parsed.data);
    setBusy(false);
    if (error) {
      if (error.code === "23505") {
        setDone(true);
        toast.success("You're already on the list — see you there!");
        return;
      }
      toast.error("Could not add you to the list. Please try again.");
      return;
    }
    setDone(true);
    toast.success("You're on the guest list!");
  }

  return (
    <section id="guest-list" className="bg-navy px-6 py-20 text-foam md:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
        <div>
          <span className="eyebrow block text-gold">Attending, not selling?</span>
          <h2 className="mt-3 font-serif text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold">
            Join the guest list
          </h2>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-foam-dim">
            Drop your name and email and we&apos;ll send you the line-up, opening times and
            early-bird surprises before the gates open.
          </p>
        </div>

        {done ? (
          <div className="rounded-md bg-foam p-9 text-ink shadow-lift">
            <h3 className="font-serif text-2xl font-semibold">You&apos;re in 🎉</h3>
            <p className="mt-3 text-sm text-ink/70">
              We&apos;ve saved <span className="font-mono font-bold">{email}</span>. Watch your
              inbox for the full programme.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-md bg-foam p-9 text-ink shadow-lift">
            <label className="eyebrow block text-ink/60" htmlFor="attendee-name">
              Full name
            </label>
            <input
              id="attendee-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className="mt-2 w-full rounded-sm border border-ink/15 bg-foam-dim px-4 py-3 text-sm outline-none focus:border-coral"
            />
            <label className="eyebrow mt-5 block text-ink/60" htmlFor="attendee-email">
              Email address
            </label>
            <input
              id="attendee-email"
              type="email"
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-2 w-full rounded-sm border border-ink/15 bg-foam-dim px-4 py-3 font-mono text-sm outline-none focus:border-coral"
            />
            <button
              type="submit"
              disabled={busy}
              className="eyebrow mt-6 w-full rounded-sm bg-coral px-6 py-4 text-foam disabled:opacity-60"
            >
              {busy ? "Adding you…" : "Count me in →"}
            </button>
            <p className="mt-3 text-xs text-ink/55">
              No spam — event updates only. Unsubscribe any time.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
