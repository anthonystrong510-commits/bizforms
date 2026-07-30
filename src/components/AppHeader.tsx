import { Link } from "@tanstack/react-router";
import { LayoutGrid, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AppHeader({ title }: { title?: string }) {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4">
      <Link to="/" className="flex items-center gap-2">
        <LayoutGrid className="size-5 text-primary" />
        <span className="font-display text-base font-bold tracking-tight">Formcraft</span>
      </Link>
      {title ? (
        <span className="truncate text-sm text-muted-foreground">
          <span className="mx-2 text-border">/</span>
          {title}
        </span>
      ) : null}
      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <>
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
