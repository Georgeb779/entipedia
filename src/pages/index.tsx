import type { JSX } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components";
import { useAuth } from "@/hooks";

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
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-6 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-16 py-16 text-center">
        <section className="space-y-6">
          <h1 className="text-5xl font-bold">Entipedia</h1>
          <p className="text-2xl text-gray-300">
            Manage your work, projects, and files from a single modern workspace.
          </p>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Entipedia brings task tracking, project planning, Kanban boards, and secure file storage
            together so your team can stay organized and move faster.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/auth/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid w-full gap-6 text-left sm:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <h2 className="text-xl font-semibold">Stay on top of tasks</h2>
            <p className="mt-2 text-sm text-gray-400">
              Organize to-dos with statuses, priorities, and due dates. Switch between list and
              Kanban views instantly.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <h2 className="text-xl font-semibold">Plan every project</h2>
            <p className="mt-2 text-sm text-gray-400">
              Track progress with project dashboards and detailed overviews designed for your team.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <h2 className="text-xl font-semibold">Collaborate in context</h2>
            <p className="mt-2 text-sm text-gray-400">
              Keep everyone aligned with shared boards, recent activity, and insights surfaced in
              real time.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <h2 className="text-xl font-semibold">Secure file management</h2>
            <p className="mt-2 text-sm text-gray-400">
              Upload, categorize, and retrieve critical documents without leaving your workspace.
            </p>
          </div>
        </section>

        <nav className="flex items-center gap-4 text-sm text-gray-400">
          <Link to="/about" className="hover:text-gray-200 hover:underline">
            About
          </Link>
          <a
            href=""
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-200 hover:underline"
          >
            GitHub
          </a>
        </nav>
      </div>
    </div>
  );
}
