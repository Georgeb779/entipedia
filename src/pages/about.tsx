import type { JSX } from "react";
import { Link } from "react-router";

import { Button, LogoMark } from "@/components";

const pillars = [
  {
    title: "Unify task flows",
    body: "Track assignments from quick lists to detailed Kanban workflows, complete with priorities, due dates, and project context.",
  },
  {
    title: "Surface project insight",
    body: "Monitor progress with dashboards the moment you sign in, so bottlenecks and wins stay visible.",
  },
  {
    title: "Empower team collaboration",
    body: "Keep everyone aligned with shared boards, quick filters, and navigation that feels familiar everywhere.",
  },
  {
    title: "Secure smart storage",
    body: "Organize critical files alongside every project so context is always within reach.",
  },
];

export default function About(): JSX.Element {
  return (
    <div className="text-foreground flex min-h-screen flex-col bg-[radial-gradient(110%_130%_at_50%_-10%,rgba(246,201,14,0.18),#fffdf8_60%,#fffdf8)] px-6 pb-20">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 pt-24 text-center">
        <header className="animate-fade-in space-y-6">
          <LogoMark size="md" className="mx-auto" />
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">About Entipedia</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base">
              We built Entipedia to unify planning, documentation, and execution so modern teams can
              collaborate with clarity and momentum.
            </p>
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm">
            From Kanban boards to document hubs, every surface stays in sync—helping you ship faster
            without sacrificing focus or context.
          </p>
        </header>

        <section className="grid w-full gap-6 text-left sm:grid-cols-2">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="group relative overflow-hidden rounded-xl border border-black/5 bg-white/85 p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="from-primary/10 absolute inset-0 -z-10 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <h2 className="text-foreground text-lg font-medium">{pillar.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{pillar.body}</p>
            </article>
          ))}
        </section>

        <section className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
            Ready to get started?
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/auth/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full px-5 py-2.5 text-base sm:w-auto"
                aria-label="Create an Entipedia account"
                role="button"
              >
                Create an account
              </Button>
            </Link>
            <Link to="/auth/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="text-foreground w-full border border-black/10 bg-white px-5 py-2.5 text-base shadow-sm hover:bg-neutral-50 sm:w-auto"
                aria-label="Sign in to Entipedia"
                role="button"
              >
                Sign in
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="lg"
                className="text-foreground w-full px-5 py-2.5 text-base hover:bg-white/70 sm:w-auto"
                aria-label="Back to Entipedia home"
                role="button"
              >
                Back to home
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
