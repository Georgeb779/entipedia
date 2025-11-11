import type { JSX } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

import { Button, LogoMark } from "@/components";
import { useAuth } from "@/hooks";

const features = [
  {
    title: "Track tasks effortlessly",
    body: "Organize to-dos with statuses, priorities, and due dates. Switch between list and Kanban views instantly.",
  },
  {
    title: "Plan every project",
    body: "Track progress with dashboards and detailed overviews tailored to your workflow.",
  },
  {
    title: "Collaborate in context",
    body: "Keep everyone aligned with shared boards, recent activity, and insights surfaced in real time.",
  },
  {
    title: "Protect every file",
    body: "Upload, categorize, and retrieve critical documents without leaving your workspace.",
  },
];

export default function Home(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === "authenticated") {
      navigate("/dashboard", { replace: true });
    }
  }, [auth.status, navigate]);

  if (auth.status === "loading") {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="text-foreground relative flex min-h-screen flex-col items-center bg-[radial-gradient(110%_140%_at_30%_0%,#fff8d6,rgba(255,243,205,0.9)_45%,#fff9ee_100%)] px-6 pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_85%_at_80%_35%,rgba(253,239,182,0.65),transparent_70%)] opacity-70" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24 pt-24">
        <section className="grid items-center gap-16 text-left md:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-medium tracking-[0.2em] text-neutral-600 uppercase shadow-sm">
              <span>Steady progress, shared clarity</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl leading-[1.08] font-semibold tracking-tight text-neutral-900 md:text-6xl">
                Ship faster without the frantic catch-up meetings
              </h1>
              <p className="max-w-xl text-lg text-neutral-600">
                Entipedia keeps tasks, docs, and updates moving together so every handoff feels calm
                and everyone knows what matters next.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full rounded-lg px-5 py-3 text-base font-medium shadow-sm aria-busy:cursor-wait sm:w-auto"
                  aria-label="Create an Entipedia workspace"
                  role="button"
                >
                  Start free trial
                </Button>
              </Link>
              <Link to="/auth/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-foreground w-full rounded-lg border border-neutral-200 bg-white px-5 py-3 text-base font-medium shadow-sm hover:bg-neutral-50 sm:w-auto"
                  aria-label="Sign in to Entipedia"
                  role="button"
                >
                  Sign in
                </Button>
              </Link>
            </div>
            <dl className="grid gap-4 text-sm text-neutral-600 sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-neutral-900">78% faster standups</dt>
                <dd className="mt-1 text-xs tracking-[0.18em] text-neutral-500 uppercase">
                  After teams centralize updates
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">All-in-one workspace</dt>
                <dd className="mt-1 text-xs tracking-[0.18em] text-neutral-500 uppercase">
                  Docs, tasks, notes aligned
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">Built for growing teams</dt>
                <dd className="mt-1 text-xs tracking-[0.18em] text-neutral-500 uppercase">
                  Permissions and insights included
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="from-primary/40 absolute -inset-y-14 -right-10 -left-16 rounded-[48px] bg-linear-to-br via-white to-white opacity-70 blur-2xl" />
            <div className="shadow-primary/20 relative w-full max-w-md rounded-3xl border border-black/10 bg-white/90 p-10 shadow-xl">
              <div className="flex items-center gap-3">
                <LogoMark size="sm" />
                <div>
                  <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                    Preview
                  </p>
                  <p className="text-lg font-semibold text-neutral-900">Today at a glance</p>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-xl border border-neutral-200/60 bg-amber-50/80 px-4 py-3 text-neutral-800 shadow-sm">
                  <p className="text-xs font-medium tracking-[0.28em] text-neutral-500 uppercase">
                    Sprint focus
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">Finalize launch checklist</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    3 tasks due · Product · Updated 2m ago
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200/60 bg-white/80 px-4 py-3 text-neutral-800 shadow-sm">
                  <p className="text-xs font-medium tracking-[0.28em] text-neutral-500 uppercase">
                    Live notes
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">Roadmap review prepared</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Shared with Marketing · Comments resolved
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200/60 bg-white/80 px-4 py-3 text-neutral-800 shadow-sm">
                  <p className="text-xs font-medium tracking-[0.28em] text-neutral-500 uppercase">
                    Recent activity
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">
                    New stakeholder joined workspace
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">Access set automatically · 4m ago</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid w-full gap-8 text-left md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border border-black/5 bg-white/90 p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="from-primary/10 absolute inset-0 -z-10 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <h2 className="text-lg font-medium text-neutral-900">{feature.title}</h2>
              <p className="mt-2 text-sm text-neutral-600">{feature.body}</p>
            </div>
          ))}
        </section>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600">
          <Link to="/about" className="transition-colors hover:text-neutral-900">
            About
          </Link>
          <a
            href="https://github.com/entipedia"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-neutral-900"
          >
            GitHub
          </a>
        </nav>
      </div>
    </div>
  );
}
