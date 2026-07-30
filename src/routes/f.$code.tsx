import { createFileRoute } from "@tanstack/react-router";
import { FormFill } from "@/components/FormFill";

export const Route = createFileRoute("/f/$code")({
  head: () => ({
    meta: [
      { title: "Fill in this form — Formcraft" },
      { name: "description", content: "Complete and submit this form. It only takes a minute." },
      { property: "og:title", content: "Fill in this form — Formcraft" },
      { property: "og:description", content: "Complete and submit this form. It only takes a minute." },
    ],
  }),
  component: () => <FormFill by="short_code" value={Route.useParams().code} />,
});
