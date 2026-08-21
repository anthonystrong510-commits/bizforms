import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Formcraft form builder" },
      { name: "description", content: "Sign in to build forms, share links and view responses." },
      { property: "og:title", content: "Sign in — Formcraft" },
      { property: "og:description", content: "Admin access to the Formcraft form builder." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { next } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: next && next.startsWith("/") ? next : "/" });
  }, [session, navigate, next]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) toast.success("Check your email to confirm your account.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Google sign-in failed");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="banner-crimson relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-6" />
          <span className="font-display text-lg font-bold">Formcraft</span>
        </div>
        <div>
          <h1 className="max-w-md text-5xl leading-[1.05] font-extrabold">
            Beautiful forms. Real answers.
          </h1>
          <p className="mt-4 max-w-sm text-primary-foreground/80">
            Build vendor applications, surveys and registrations, publish a clean link, shorten it,
            and watch responses arrive live.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">Only admins can create forms.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your forms.</p>

          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password2">Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Create account
                </Button>
                <p className="text-xs text-muted-foreground">
                  The first account created becomes the admin. Everyone else joins as a viewer.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
      </section>
    </main>
  );
}
