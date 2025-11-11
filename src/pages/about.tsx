import type { JSX } from "react";
import { Link } from "react-router";

import { Button } from "@/components";

export default function About(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">About Entipedia</h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-300">
            Entipedia is the productivity workspace built to connect your team&apos;s tasks,
            projects, and files in one cohesive platform.
          </p>
        </header>

        <section className="grid gap-8 text-left sm:grid-cols-2">
          <article className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <h2 className="text-xl font-semibold">Unified task management</h2>
            <p className="mt-2 text-sm text-gray-400">
              Track assignments from quick lists to detailed Kanban workflows, complete with
              priorities, due dates, and project context.
            </p>
          </article>
          <article className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <h2 className="text-xl font-semibold">Project insights</h2>
            <p className="mt-2 text-sm text-gray-400">
              Monitor progress with dashboards the moment you sign in, so bottlenecks and wins are
              always visible.
            </p>
          </article>
          <article className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <h2 className="text-xl font-semibold">Team collaboration</h2>
            <p className="mt-2 text-sm text-gray-400">
              Keep everyone aligned with shared boards, quick filters, and consistent navigation
              across every workspace page.
            </p>
          </article>
          <article className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <h2 className="text-xl font-semibold">Secure storage</h2>
            <p className="mt-2 text-sm text-gray-400">
              Organize supporting documents alongside each project so the context you need is never
              more than a click away.
            </p>
          </article>
        </section>

        <section className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm tracking-wide text-gray-400 uppercase">Ready to get started?</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link to="/auth/register">
              <Button size="lg">Create an account</Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="lg">
                Back to home
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
