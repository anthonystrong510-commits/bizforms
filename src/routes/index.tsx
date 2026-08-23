import { createFileRoute, Link } from "@tanstack/react-router";
import { useSite } from "@/lib/site";
import { SiteFooter, SiteNav } from "@/components/site/SiteChrome";
import { AttendeeSignup } from "@/components/site/AttendeeSignup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Market Fest — Vendor & Community Marketplace" },
      {
        name: "description",
        content:
          "A weekend market for makers, food lovers and families. See event hours, booth pricing and apply to vend online.",
      },
      { property: "og:title", content: "Market Fest — Vendor & Community Marketplace" },
      {
        property: "og:description",
        content: "Event details, booth pricing and the online vendor application.",
      },
    ],
  }),
  component: EventHome,
});

function EventHome() {
  const { data: site, isLoading } = useSite();

  if (isLoading || !site) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foam">
        <p className="eyebrow text-teal">Loading the event…</p>
      </div>
    );
  }

  const s = site;

  return (
    <div className="bg-foam text-ink">
      <SiteNav brand={s.brand} cta={s.hero.primary_cta} />

      {/* HERO */}
      <section id="top" className="relative overflow-hidden bg-navy p-0">
        <div className="relative aspect-[4/5] w-full sm:aspect-[2/1]">
          {s.hero.image_url ? (
            <img
              src={s.hero.image_url}
              alt={`${s.hero.title} event banner`}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-navy-deep" />
          )}
          <div className="absolute inset-0 bg-navy-deep/70" />
        </div>

        <div className="absolute inset-x-0 bottom-0 pt-8 pb-10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-8 px-6">
            <div className="max-w-2xl">
              <p className="eyebrow flex items-center gap-3 text-gold">
                <span className="inline-block h-px w-7 bg-gold" />
                {s.hero.eyebrow}
              </p>
              <h1 className="mt-4 font-serif text-[clamp(2.1rem,4.6vw,3.6rem)] leading-none font-semibold text-foam">
                {s.hero.title}
              </h1>
              <p className="mt-4 max-w-[44ch] text-foam-dim">{s.hero.lede}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/apply"
                  className="eyebrow rounded-sm bg-gold px-6 py-4 text-navy-deep transition hover:-translate-y-0.5"
                >
                  {s.hero.primary_cta} →
                </Link>
                <a
                  href="#overview"
                  className="eyebrow rounded-sm border border-foam/25 px-6 py-4 text-foam transition hover:bg-foam/10"
                >
                  {s.hero.secondary_cta}
                </a>
              </div>
            </div>

            <div className="hidden size-[150px] shrink-0 items-center justify-center sm:flex">
              <div className="flex size-[114px] flex-col items-center justify-center rounded-full border-[3px] border-foam bg-navy-deep text-center shadow-lift">
                <b className="font-serif text-[0.8rem] leading-tight text-foam">{s.badge.top}</b>
                <em className="font-serif text-[0.9rem] font-semibold text-gold">{s.badge.middle}</em>
                <b className="font-serif text-[0.8rem] leading-tight text-foam">{s.badge.bottom}</b>
                <span className="text-coral">♥</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FACTS */}
      {s.facts.length ? (
        <div className="border-b border-ink/10 bg-foam-dim">
          <div className="mx-auto flex max-w-6xl flex-wrap px-6">
            {s.facts.map((f, i) => (
              <div
                key={i}
                className="flex-1 basis-[200px] border-r border-ink/10 px-5 py-6 last:border-r-0"
              >
                <b className="eyebrow block text-coral">{f.label}</b>
                <span className="mt-1 block text-sm font-semibold">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* OVERVIEW */}
      <section id="overview" className="mx-auto max-w-6xl px-6 py-20">
        <Head eyebrow={s.overview.eyebrow} title={s.overview.title} />
        <div className="grid gap-14 md:grid-cols-2">
          <div>
            <p className="leading-relaxed text-ink/80">{s.overview.body1}</p>
            <p className="mt-4 leading-relaxed text-ink/80">{s.overview.body2}</p>
          </div>
          {s.overview.quote ? (
            <blockquote className="border-l-[3px] border-gold pl-6 font-serif text-xl font-medium italic text-teal-deep">
              {s.overview.quote}
            </blockquote>
          ) : null}
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      {s.expect.length ? (
        <section id="expect" className="mx-auto max-w-6xl px-6 pb-20">
          <Head eyebrow="What to Expect" title="One weekend, plenty of reasons to stay all day." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {s.expect.map((c, i) => (
              <div
                key={i}
                className="rounded-md border-t-[3px] bg-navy p-7 text-foam"
                style={{
                  borderTopColor: `var(--${["gold", "coral", "teal"][i % 3]})`,
                }}
              >
                <p className="eyebrow text-gold">{c.eyebrow}</p>
                <h3 className="mt-2 font-serif text-lg text-foam">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foam-dim">{c.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* EVENT INFO */}
      <section id="info" className="border-y border-ink/10 bg-foam-dim py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Head eyebrow="Event Information" title={s.info.note} />
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-8 sm:grid-cols-2">
              <InfoList title="Hours" items={s.info.hours} />
              <InfoList title="Set-Up Information" items={s.info.setup} />
            </div>
            <div className="-rotate-1 rounded-md border-2 border-dashed border-navy-deep bg-gold p-8 text-navy-deep shadow-lift">
              <span className="block text-2xl">🔒</span>
              <h3 className="mt-2 font-serif text-xl font-semibold italic">
                {s.info.overnight.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed">{s.info.overnight.body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <Head eyebrow={s.pricing.eyebrow} title={s.pricing.title} sub={s.pricing.subtitle} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {s.pricing.tiers.map((t, i) => (
            <div
              key={i}
              className={`relative rounded-md p-7 ${
                t.featured
                  ? "border border-gold bg-navy text-foam shadow-lift"
                  : "border border-ink/10 bg-foam-dim"
              }`}
            >
              {t.featured ? (
                <span className="eyebrow absolute -top-3 right-6 rounded-full bg-gold px-3 py-1 text-navy-deep">
                  Most popular
                </span>
              ) : null}
              <p className={`eyebrow ${t.featured ? "text-gold" : "text-coral"}`}>{t.name}</p>
              <p className="mt-3 font-serif text-4xl font-semibold">
                {t.price}{" "}
                <span className="font-sans text-sm font-medium opacity-70">{t.unit}</span>
              </p>
              <ul className="mt-5 space-y-2">
                {t.features.map((f, j) => (
                  <li
                    key={j}
                    className={`flex gap-2 text-sm ${t.featured ? "text-foam-dim" : "text-ink/75"}`}
                  >
                    <span className={t.featured ? "text-gold" : "text-coral"}>—</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {s.pricing.note ? <p className="mt-6 text-sm text-ink/60">{s.pricing.note}</p> : null}
      </section>

      {/* POLICIES */}
      {s.policies.length ? (
        <section className="border-t border-ink/10 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Head eyebrow="Policies & Requirements" title="Good to know before you set up." />
            <div className="grid gap-10 md:grid-cols-2">
              {s.policies.map((g, i) => (
                <div key={i}>
                  <h3 className="font-serif text-xl">{g.title}</h3>
                  <ul className="mt-4">
                    {g.items.map((it, j) => (
                      <li
                        key={j}
                        className="flex gap-3 border-b border-ink/10 py-3 text-sm text-ink/80 last:border-b-0"
                      >
                        <span className="text-coral">—</span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* SELECTION STEPS */}
      {s.selection.length ? (
        <section className="bg-foam-dim py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Head eyebrow="Vendor Selection" title="What happens after you apply." />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {s.selection.map((c, i) => (
                <div key={i} className="rounded-md border border-ink/10 bg-foam p-6">
                  <span className="eyebrow text-teal">Step {String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 font-serif text-lg">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* VENDOR CALL */}
      <section className="relative bg-teal pt-16 text-foam">
        <div className="torn-edge absolute inset-x-0 -top-px h-4 bg-foam-dim" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-14 md:grid-cols-2">
          <div>
            <p className="eyebrow text-gold">{s.vendor_call.eyebrow}</p>
            <h2 className="mt-3 font-serif text-[clamp(1.8rem,3.2vw,2.5rem)] font-semibold text-foam">
              {s.vendor_call.title}
            </h2>
            <p className="mt-4 max-w-[44ch] leading-relaxed text-foam/90">{s.vendor_call.body}</p>
          </div>
          {s.vendor_call.perks.length ? (
            <div className="gold-tag-clip bg-gold px-9 py-9 text-navy-deep">
              <h3 className="font-serif text-2xl font-semibold italic">Why vend with us</h3>
              <ul className="mt-4">
                {s.vendor_call.perks.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 py-1.5 font-semibold">
                    <span>✔</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* CATEGORIES + APPLY */}
      <section id="apply" className="bg-navy py-20 text-foam">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow text-gold">Vendor Opportunities</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-foam">
              We're currently accepting vendors in:
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {s.categories.map((c) => (
                <span
                  key={c}
                  className="eyebrow relative rounded-sm border border-foam/20 bg-foam/5 py-2.5 pr-4 pl-7 text-foam normal-case"
                >
                  <span className="absolute top-1/2 left-3 size-1.5 -translate-y-1/2 rounded-full bg-gold" />
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-8 max-w-[52ch] text-sm text-foam-dim">{s.apply.note}</p>
          </div>

          <div className="rounded-md bg-foam p-9 text-ink shadow-lift">
            <h3 className="font-serif text-2xl font-semibold">{s.apply.title}</h3>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink/75">
              {s.apply.steps.map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ol>
            <Link
              to="/apply"
              className="eyebrow mt-6 block rounded-sm bg-coral px-6 py-4 text-center text-foam"
            >
              Apply online →
            </Link>
            <div className="mt-5 space-y-2 text-sm">
              {s.apply.email ? (
                <p className="flex flex-wrap justify-between gap-2 rounded-sm bg-foam-dim px-4 py-3 font-mono font-bold">
                  {s.apply.email}
                  <a href={`mailto:${s.apply.email}`} className="text-coral">
                    Open email →
                  </a>
                </p>
              ) : null}
              {s.apply.phone ? (
                <p className="flex flex-wrap justify-between gap-2 rounded-sm bg-foam-dim px-4 py-3 font-mono font-bold">
                  {s.apply.phone}
                  <span className="font-sans font-normal text-ink/60">Questions? Call or email</span>
                </p>
              ) : null}
            </div>
            {s.apply.closing ? (
              <p className="mt-5 text-sm text-ink/70">{s.apply.closing}</p>
            ) : null}
          </div>
        </div>
      </section>

      <AttendeeSignup />

      <SiteFooter site={s} />
    </div>
  );
}

function Head({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-12 max-w-2xl">
      {eyebrow ? <span className="eyebrow block text-coral">{eyebrow}</span> : null}
      <h2 className="mt-3 font-serif text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold">{title}</h2>
      {sub ? <p className="mt-4 leading-relaxed text-ink/70">{sub}</p> : null}
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-serif text-xl">{title}</h3>
      <ul className="mt-3">
        {items.map((i, k) => (
          <li
            key={k}
            className="flex gap-3 border-b border-ink/10 py-3 text-sm text-ink/80 last:border-b-0"
          >
            <span className="font-bold text-coral">—</span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
