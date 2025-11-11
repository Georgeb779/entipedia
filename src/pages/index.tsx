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
    <div className="text-foreground flex min-h-screen flex-col items-center bg-[radial-gradient(110%_130%_at_50%_-10%,rgba(246,201,14,0.18),#fffdf8_60%,#fffdf8)] px-6 pb-20">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-20 pt-24 text-center">
        <section className="animate-fade-in relative w-full space-y-6">
          <div className="bg-primary/25 absolute inset-x-0 -top-10 -z-10 mx-auto h-44 w-md rounded-full blur-3xl" />
          <LogoMark size="md" className="mx-auto" />
          <div className="space-y-4">
            <h1 className="text-foreground text-6xl font-semibold tracking-tight">Entipedia</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base">
              The calm workspace where tasks, notes, and projects stay organized and your team keeps
              moving forward.
            </p>
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm">
            Reduce busywork with shared Kanban boards, searchable documents, and smart progress
            tracking all in one place.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Link to="/auth/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full px-5 py-2.5 text-base"
                aria-label="Get started with Entipedia"
                role="button"
              >
                Get Started
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
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid w-full gap-6 text-left md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border border-black/5 bg-white/80 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="from-primary/10 absolute inset-0 -z-10 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <h2 className="text-foreground text-lg font-medium">{feature.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{feature.body}</p>
            </div>
          ))}
        </section>

        <nav className="text-muted-foreground flex flex-wrap items-center justify-center gap-6 text-sm">
          <Link to="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <a
            href="https://github.com/entipedia"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </div>
  );
}
