import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeImageUrl } from "@/lib/site-assets";

export type Fact = { label: string; value: string };
export type Tier = {
  name: string;
  price: string;
  unit: string;
  featured: boolean;
  features: string[];
};
export type Card = { eyebrow?: string; title: string; body: string };
export type Group = { title: string; items: string[] };
export type Social = { label: string; url: string };

export type SiteContent = {
  brand: string;
  favicon_url: string;
  hero: {
    eyebrow: string;
    title: string;
    lede: string;
    image_url: string;
    primary_cta: string;
    secondary_cta: string;
  };
  badge: { top: string; middle: string; bottom: string };
  facts: Fact[];
  overview: {
    eyebrow: string;
    title: string;
    body1: string;
    body2: string;
    quote: string;
  };
  expect: Card[];
  info: {
    note: string;
    hours: string[];
    setup: string[];
    overnight: { title: string; body: string };
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    note: string;
    tiers: Tier[];
  };
  policies: Group[];
  selection: Card[];
  vendor_call: { eyebrow: string; title: string; body: string; perks: string[] };
  categories: string[];
  apply: {
    title: string;
    steps: string[];
    email: string;
    phone: string;
    note: string;
    closing: string;
    form_slug: string;
  };
  footer: {
    blurb: string;
    address: string;
    email: string;
    phone: string;
    socials: Social[];
    copyright: string;
  };
};

export const EMPTY_SITE: SiteContent = {
  brand: "Event",
  favicon_url: "",
  hero: {
    eyebrow: "",
    title: "Event",
    lede: "",
    image_url: "",
    primary_cta: "Become a Vendor",
    secondary_cta: "Explore",
  },
  badge: { top: "", middle: "", bottom: "" },
  facts: [],
  overview: { eyebrow: "", title: "", body1: "", body2: "", quote: "" },
  expect: [],
  info: { note: "", hours: [], setup: [], overnight: { title: "", body: "" } },
  pricing: { eyebrow: "", title: "", subtitle: "", note: "", tiers: [] },
  policies: [],
  selection: [],
  vendor_call: { eyebrow: "", title: "", body: "", perks: [] },
  categories: [],
  apply: { title: "", steps: [], email: "", phone: "", note: "", closing: "", form_slug: "" },
  footer: { blurb: "", address: "", email: "", phone: "", socials: [], copyright: "" },
};

/** Merge stored JSON over the empty shape so partial records never crash the UI. */
export function normalizeSite(raw: unknown): SiteContent {
  const d = (raw ?? {}) as Record<string, unknown>;
  const merge = <T,>(base: T, next: unknown): T =>
    next && typeof next === "object" && !Array.isArray(next)
      ? { ...base, ...(next as object) }
      : base;
  const arr = <T,>(next: unknown, fallback: T[]): T[] => (Array.isArray(next) ? (next as T[]) : fallback);

  return {
    brand: typeof d.brand === "string" ? d.brand : EMPTY_SITE.brand,
    favicon_url: normalizeImageUrl(d.favicon_url),
    hero: {
      ...merge(EMPTY_SITE.hero, d.hero),
      image_url: normalizeImageUrl((d.hero as { image_url?: unknown })?.image_url),
    },
    badge: merge(EMPTY_SITE.badge, d.badge),
    facts: arr<Fact>(d.facts, []),
    overview: merge(EMPTY_SITE.overview, d.overview),
    expect: arr<Card>(d.expect, []),
    info: {
      ...merge(EMPTY_SITE.info, d.info),
      hours: arr<string>((d.info as { hours?: unknown })?.hours, []),
      setup: arr<string>((d.info as { setup?: unknown })?.setup, []),
      overnight: merge(EMPTY_SITE.info.overnight, (d.info as { overnight?: unknown })?.overnight),
    },
    pricing: {
      ...merge(EMPTY_SITE.pricing, d.pricing),
      tiers: arr<Tier>((d.pricing as { tiers?: unknown })?.tiers, []),
    },
    policies: arr<Group>(d.policies, []),
    selection: arr<Card>(d.selection, []),
    vendor_call: {
      ...merge(EMPTY_SITE.vendor_call, d.vendor_call),
      perks: arr<string>((d.vendor_call as { perks?: unknown })?.perks, []),
    },
    categories: arr<string>(d.categories, []),
    apply: {
      ...merge(EMPTY_SITE.apply, d.apply),
      steps: arr<string>((d.apply as { steps?: unknown })?.steps, []),
    },
    footer: {
      ...merge(EMPTY_SITE.footer, d.footer),
      socials: arr<Social>((d.footer as { socials?: unknown })?.socials, []),
    },
  };
}

export async function fetchSite(): Promise<SiteContent> {
  const { data, error } = await supabase
    .from("site_content")
    .select("data")
    .eq("id", "main")
    .maybeSingle();
  if (error) throw error;
  return normalizeSite(data?.data);
}

export function useSite() {
  return useQuery({ queryKey: ["site-content"], queryFn: fetchSite });
}
