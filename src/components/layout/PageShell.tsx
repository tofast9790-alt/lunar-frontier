import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageShell({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <main className="starfield min-h-[100dvh] w-full">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="hud" size="sm" asChild>
            <Link to="/">
              <ArrowLeft aria-hidden /> Main menu
            </Link>
          </Button>
          <span className="hud-label">Lunar Frontier · Prototype</span>
        </div>
        <div className="hud-label text-primary">{kicker}</div>
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl">{title}</h1>
        {children}
      </div>
    </main>
  );
}
