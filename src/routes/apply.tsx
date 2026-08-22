import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchSite } from "@/lib/site";
import { FormFill } from "@/components/FormFill";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Vendor Application — Market Fest" },
      {
        name: "description",
        content:
          "Apply for a booth at Market Fest. Fill in the vendor application form and we'll be in touch.",
      },
      { property: "og:title", content: "Vendor Application — Market Fest" },
      {
        property: "og:description",
        content: "Apply online for a booth at the market weekend.",
      },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["apply-form"],
    queryFn: async () => {
      const site = await fetchSite();
      const wanted = site.apply.form_slug?.trim();
      if (wanted) return wanted;
      const { data: forms, error } = await supabase
        .from("forms")
        .select("slug,created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return forms?.[0]?.slug ?? null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foam">
        <p className="eyebrow text-teal">Loading application…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-foam px-6 text-center">
        <h1 className="font-serif text-2xl font-semibold">Applications aren't open yet</h1>
        <p className="max-w-sm text-sm text-ink/70">
          The vendor application form hasn't been published. Please check back soon.
        </p>
        <Link to="/" className="eyebrow rounded-sm bg-navy px-5 py-3 text-foam">
          Back to the event
        </Link>
      </div>
    );
  }

  return <FormFill by="slug" value={data} />;
}
