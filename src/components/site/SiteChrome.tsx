import { Link } from "@tanstack/react-router";
import type { SiteContent } from "@/lib/site";

const NAV = [
  { href: "#overview", label: "About" },
  { href: "#info", label: "Event Info" },
  { href: "#pricing", label: "Booth Pricing" },
  { href: "#apply", label: "Vendors" },
];

export function SiteNav({ brand, cta }: { brand: string; cta: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-foam/15 bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 text-foam">
        <Link to="/" className="flex items-center gap-2.5 font-serif text-lg font-semibold">
          <span className="inline-block size-2.5 rounded-full bg-gold" />
          {brand}
        </Link>
        <nav className="hidden gap-7 text-sm md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="opacity-85 transition hover:opacity-100">
              {n.label}
            </a>
          ))}
        </nav>
        <Link
          to="/apply"
          className="eyebrow rounded-sm bg-gold px-4 py-2.5 text-navy-deep whitespace-nowrap"
        >
          {cta}
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter({ site }: { site: SiteContent }) {
  const f = site.footer;
  return (
    <footer className="border-t border-foam/15 bg-navy-deep py-14 text-foam">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2.5 font-serif text-lg font-semibold">
            <span className="inline-block size-2.5 rounded-full bg-gold" />
            {site.brand}
          </p>
          <p className="mt-3 max-w-[40ch] text-sm text-foam/70">{f.blurb}</p>
        </div>
        <div>
          <p className="eyebrow text-gold">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-foam/80">
            {f.address ? <li>{f.address}</li> : null}
            {f.email ? (
              <li>
                <a className="hover:text-gold" href={`mailto:${f.email}`}>
                  {f.email}
                </a>
              </li>
            ) : null}
            {f.phone ? (
              <li>
                <a className="hover:text-gold" href={`tel:${f.phone.replace(/\s/g, "")}`}>
                  {f.phone}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
        <div>
          <p className="eyebrow text-gold">Follow</p>
          <ul className="mt-3 space-y-2 text-sm text-foam/80">
            {f.socials.map((s) => (
              <li key={s.label}>
                <a href={s.url} className="hover:text-gold" target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/admin" className="text-foam/50 hover:text-gold">
                Organiser login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-foam/10 px-6 pt-6 text-xs text-foam/50">
        {f.copyright}
      </div>
    </footer>
  );
}
