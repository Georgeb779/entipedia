import { useMemo } from "react";
import { Link } from "react-router";
import { CheckSquare, Clock, FolderKanban } from "lucide-react";

import { Layout, ProtectedRoute } from "@/components";
import { Badge, Button } from "@/components/ui";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
} from "@/constants";
import { useProjects, useTasks } from "@/hooks";
import type { ProjectStatus, Task, TaskPriority, TaskStatus } from "@/types";
import { formatTaskDate } from "@/utils";

type TasksOverviewCardProps = {
  totalTasks: number;
  completionRate: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
};

const TasksOverviewCard = ({
  totalTasks,
  completionRate,
  todoTasks,
  inProgressTasks,
  completedTasks,
}: TasksOverviewCardProps) => {
  const safeCompletion = Math.min(Math.max(completionRate, 0), 100);
  const breakdown = [
    { label: "To Do", value: todoTasks },
    { label: "In Progress", value: inProgressTasks },
    { label: "Done", value: completedTasks },
  ];

  return (
    <article className="min-h-40 rounded-xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          <CheckSquare className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="line-clamp-1 text-2xl leading-tight font-semibold text-neutral-900">
            {totalTasks.toLocaleString()}
          </span>
          <span className="line-clamp-1 text-sm text-neutral-600">Tasks Overview</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span className="line-clamp-1">{safeCompletion}% completed</span>
          <span className="line-clamp-1">{completedTasks.toLocaleString()} done</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-neutral-200"
          role="presentation"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-neutral-800 transition-all"
            style={{ width: `${totalTasks > 0 ? safeCompletion : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm text-neutral-600"
          >
            <span className="line-clamp-1">{item.label}</span>
            <span className="line-clamp-1">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Link
          to="/tasks"
          className="text-sm text-yellow-600 transition hover:text-yellow-500 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
        >
          View tasks →
        </Link>
      </div>
    </article>
  );
};

type ProjectsOverviewCardProps = {
  totalProjects: number;
  completionRate: number;
  todoProjects: number;
  inProgressProjects: number;
  completedProjects: number;
};

const ProjectsOverviewCard = ({
  totalProjects,
  completionRate,
  todoProjects,
  inProgressProjects,
  completedProjects,
}: ProjectsOverviewCardProps) => {
  const safeCompletion = Math.min(Math.max(completionRate, 0), 100);
  const breakdown = [
    { label: PROJECT_STATUS_LABELS.todo, value: todoProjects },
    { label: PROJECT_STATUS_LABELS.in_progress, value: inProgressProjects },
    { label: PROJECT_STATUS_LABELS.done, value: completedProjects },
  ];

  return (
    <article className="min-h-40 rounded-xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          <FolderKanban className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="line-clamp-1 text-2xl leading-tight font-semibold text-neutral-900">
            {totalProjects.toLocaleString()}
          </span>
          <span className="line-clamp-1 text-sm text-neutral-600">Projects Overview</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span className="line-clamp-1">{safeCompletion}% completed</span>
          <span className="line-clamp-1">{completedProjects.toLocaleString()} done</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-neutral-200"
          role="presentation"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-neutral-800 transition-all"
            style={{ width: `${totalProjects > 0 ? safeCompletion : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm text-neutral-600"
          >
            <span className="line-clamp-1">{item.label}</span>
            <span className="line-clamp-1">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Link
          to="/projects"
          className="text-sm text-yellow-600 transition hover:text-yellow-500 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
        >
          View projects →
        </Link>
      </div>
    </article>
  );
};

type DueSoonCardProps = {
  upcomingTasks: Task[];
  tasksWithDueDate: number;
};

const DueSoonCard = ({ upcomingTasks, tasksWithDueDate }: DueSoonCardProps) => {
  const upcomingCount = upcomingTasks.length;
  const safeCoverage = Math.min(
    Math.max(tasksWithDueDate > 0 ? Math.round((upcomingCount / tasksWithDueDate) * 100) : 0, 0),
    100,
  );
  const nextDueTask = upcomingTasks[0] ?? null;
  const upcomingPreview = upcomingTasks.slice(0, 3);

  return (
    <article className="min-h-40 rounded-xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          <Clock className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="line-clamp-1 text-2xl leading-tight font-semibold text-neutral-900">
            {upcomingCount.toLocaleString()}
          </span>
          <span className="line-clamp-1 text-sm text-neutral-600">Due Soon</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span className="line-clamp-1">{safeCoverage}% of due-date tasks</span>
          <span className="line-clamp-1">{tasksWithDueDate.toLocaleString()} total</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-neutral-200"
          role="presentation"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-neutral-800 transition-all"
            style={{ width: `${tasksWithDueDate > 0 ? safeCoverage : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-3 text-sm text-neutral-600">
        {nextDueTask ? (
          <span className="line-clamp-1">Next due: {formatTaskDate(nextDueTask.dueDate)}</span>
        ) : (
          <span className="line-clamp-1">No upcoming deadlines.</span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {upcomingPreview.length === 0 ? (
          <p className="text-sm text-neutral-600">All caught up for now.</p>
        ) : (
          upcomingPreview.map((task) => (
            <div
              key={task.id}
              className="flex items-start justify-between gap-3 border-b border-black/5 pb-2 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm text-neutral-900">{task.title}</p>
                <p className="line-clamp-1 text-xs text-neutral-600">
                  Due {formatTaskDate(task.dueDate)}
                </p>
              </div>
              <Badge className={resolveStatusBadgeClass(task.status)}>
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
            </div>
          ))
        )}
      </div>

      <div className="mt-3">
        <Link
          to="/tasks"
          className="text-sm text-yellow-600 transition hover:text-yellow-500 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
        >
          View tasks →
        </Link>
      </div>
    </article>
  );
};

const resolveStatusBadgeClass = (status: TaskStatus) =>
  status === "done" ? "bg-neutral-100 text-neutral-700" : TASK_STATUS_COLORS[status];

const resolvePriorityBadgeClass = (priority: TaskPriority | null) => {
  if (!priority) {
    return null;
  }

  if (priority === "medium") {
    return "bg-neutral-100 text-neutral-700";
  }

  return TASK_PRIORITY_COLORS[priority];
};

const resolveTimestamp = (value: Date | string) =>
  value instanceof Date ? value.getTime() : new Date(value).getTime();

const resolveDueDate = (value: Task["dueDate"]) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};

const resolvePriority = (priority: Task["priority"]): TaskPriority | null => {
  if (priority === "low" || priority === "medium" || priority === "high") {
    return priority;
  }

  return null;
};

/**
 * Provides an overview of tasks and projects with quick access to recent activity.
 */
const DashboardPage = () => {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((task) => task.status === "todo").length;
    const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
    const completedTasks = tasks.filter((task) => task.status === "done").length;
    const totalProjects = projects.length;
    const projectStatusCounts = projects.reduce<Record<ProjectStatus, number>>(
      (accumulator, project) => {
        accumulator[project.status] += 1;
        return accumulator;
      },
      { todo: 0, in_progress: 0, done: 0 },
    );
    const tasksWithDueDate = tasks.filter((task) => task.dueDate !== null).length;
    const todoProjects = projectStatusCounts.todo;
    const inProgressProjects = projectStatusCounts.in_progress;
    const completedProjects = projectStatusCounts.done;

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      totalProjects,
      projectStatusCounts,
      todoProjects,
      inProgressProjects,
      completedProjects,
      tasksWithDueDate,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      projectCompletionRate:
        totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
    };
  }, [projects, tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => resolveTimestamp(b.createdAt) - resolveTimestamp(a.createdAt))
      .slice(0, 5);
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((task) => {
        const dueDate = resolveDueDate(task.dueDate);
        return dueDate && dueDate.getTime() > now.getTime() && task.status !== "done";
      })
      .sort((a, b) => {
        const dueA = resolveDueDate(a.dueDate)?.getTime() ?? 0;
        const dueB = resolveDueDate(b.dueDate)?.getTime() ?? 0;
        return dueA - dueB;
      })
      .slice(0, 5);
  }, [tasks]);

  const recentTasksPreview = useMemo(() => recentTasks.slice(0, 3), [recentTasks]);
  const upcomingTasksPreview = useMemo(() => upcomingTasks.slice(0, 3), [upcomingTasks]);

  const isLoading = tasksLoading || projectsLoading;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-muted-foreground flex min-h-screen items-center justify-center">
            <p>Loading dashboard...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="bg-[#FFFCF5]">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <header className="space-y-1">
              <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
              <p className="text-sm text-neutral-600">Overview of your tasks and projects.</p>
            </header>

            <div className="mt-6 space-y-6">
              <section className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <TasksOverviewCard
                  totalTasks={stats.totalTasks}
                  completionRate={stats.completionRate}
                  todoTasks={stats.todoTasks}
                  inProgressTasks={stats.inProgressTasks}
                  completedTasks={stats.completedTasks}
                />

                <ProjectsOverviewCard
                  totalProjects={stats.totalProjects}
                  completionRate={stats.projectCompletionRate}
                  todoProjects={stats.todoProjects}
                  inProgressProjects={stats.inProgressProjects}
                  completedProjects={stats.completedProjects}
                />

                <DueSoonCard
                  upcomingTasks={upcomingTasks}
                  tasksWithDueDate={stats.tasksWithDueDate}
                />
              </section>

              <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <article className="min-h-40 rounded-lg border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6">
                    <div className="space-y-1">
                      <h2 className="line-clamp-1 text-2xl font-semibold text-neutral-900">
                        Recent Tasks
                      </h2>
                      <p className="line-clamp-2 text-sm text-neutral-600">
                        Latest activity across your work.
                      </p>
                    </div>
                    <div className="mt-3 space-y-3">
                      {recentTasksPreview.length === 0 ? (
                        <p className="text-sm text-neutral-600">
                          No items yet. Create your first task.
                        </p>
                      ) : (
                        recentTasksPreview.map((task) => {
                          const priority = resolvePriority(task.priority);
                          const priorityLabel = priority ? TASK_PRIORITY_LABELS[priority] : null;
                          const priorityClass = priority
                            ? resolvePriorityBadgeClass(priority)
                            : null;

                          return (
                            <div
                              key={task.id}
                              className="border-b border-black/5 pb-2 last:border-b-0 last:pb-0"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="line-clamp-1 text-sm text-neutral-900">
                                    {task.title}
                                  </p>
                                  <p className="line-clamp-1 text-xs text-neutral-600">
                                    Created {formatTaskDate(task.createdAt)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className={resolveStatusBadgeClass(task.status)}>
                                    {TASK_STATUS_LABELS[task.status]}
                                  </Badge>
                                  {priority && priorityLabel && priorityClass ? (
                                    <Badge className={priorityClass}>{priorityLabel}</Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="mt-3">
                      <Link
                        to="/tasks"
                        className="text-sm text-neutral-700 transition hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
                      >
                        View all tasks →
                      </Link>
                    </div>
                  </article>

                  <article className="min-h-40 rounded-lg border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6">
                    <div className="space-y-1">
                      <h2 className="line-clamp-1 text-2xl font-semibold text-neutral-900">
                        Upcoming Due Dates
                      </h2>
                      <p className="line-clamp-2 text-sm text-neutral-600">
                        Stay ahead of imminent deadlines.
                      </p>
                    </div>
                    <div className="mt-3 space-y-3">
                      {upcomingTasksPreview.length === 0 ? (
                        <p className="text-sm text-neutral-600">No upcoming due dates.</p>
                      ) : (
                        upcomingTasksPreview.map((task) => {
                          const priority = resolvePriority(task.priority);
                          const priorityLabel = priority ? TASK_PRIORITY_LABELS[priority] : null;
                          const priorityClass = priority
                            ? resolvePriorityBadgeClass(priority)
                            : null;

                          return (
                            <div
                              key={task.id}
                              className="border-b border-black/5 pb-2 last:border-b-0 last:pb-0"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="line-clamp-1 text-sm text-neutral-900">
                                    {task.title}
                                  </p>
                                  <div className="line-clamp-1 text-xs text-neutral-600">
                                    Due {formatTaskDate(task.dueDate)}
                                  </div>
                                </div>
                                {priority && priorityLabel && priorityClass ? (
                                  <Badge className={priorityClass}>{priorityLabel}</Badge>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="mt-3">
                      <Link
                        to="/tasks"
                        className="text-sm text-neutral-700 transition hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
                      >
                        View all tasks →
                      </Link>
                    </div>
                  </article>
                </div>
              </section>

              <section className="flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link to="/tasks">Create Task</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/projects">Create Project</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="focus-visible:ring-offset-background text-neutral-700 transition hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Link to="/tasks?view=board">View Board</Link>
                </Button>
              </section>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
