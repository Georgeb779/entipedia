import { useMemo } from "react";
import { Link } from "react-router";
import { CheckSquare, FolderKanban } from "lucide-react";

import { Layout, ProtectedRoute } from "@/components";
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
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

  return (
    <article className="rounded-xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-600">Tasks</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">
            {totalTasks.toLocaleString()}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          <CheckSquare className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-1.5 w-full rounded-full bg-neutral-200"
          role="presentation"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-yellow-500 transition-all"
            style={{ width: `${totalTasks > 0 ? safeCompletion : 0}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-neutral-600">{safeCompletion}% completed</p>
      </div>

      <div className="mt-2 flex items-center gap-4 text-sm text-neutral-700">
        <span>To Do {todoTasks.toLocaleString()}</span>
        <span>In Progress {inProgressTasks.toLocaleString()}</span>
        <span>Done {completedTasks.toLocaleString()}</span>
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

  return (
    <article className="rounded-xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-600">Projects</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">
            {totalProjects.toLocaleString()}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          <FolderKanban className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-1.5 w-full rounded-full bg-neutral-200"
          role="presentation"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-yellow-500 transition-all"
            style={{ width: `${totalProjects > 0 ? safeCompletion : 0}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-neutral-600">{safeCompletion}% completed</p>
      </div>

      <div className="mt-2 flex items-center gap-4 text-sm text-neutral-700">
        <span>To Do {todoProjects.toLocaleString()}</span>
        <span>In Progress {inProgressProjects.toLocaleString()}</span>
        <span>Done {completedProjects.toLocaleString()}</span>
      </div>
    </article>
  );
};

type EmptyOverviewCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
};

const EmptyOverviewCard = ({
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyOverviewCardProps) => (
  <article className="rounded-xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
    <h2 className="text-sm text-neutral-600">{title}</h2>
    <p className="mt-2 text-sm text-neutral-600">{description}</p>
    <Button asChild variant="secondary" className="mt-4">
      <Link to={actionTo}>{actionLabel}</Link>
    </Button>
  </article>
);

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

type WorkActivityTabsProps = {
  recentTasks: Task[];
  upcomingTasks: Task[];
};

const WorkActivityTabs = ({ recentTasks, upcomingTasks }: WorkActivityTabsProps) => {
  const recentPreview = recentTasks.slice(0, 5);
  const duePreview = upcomingTasks.slice(0, 5);
  const dueCount = upcomingTasks.length;
  const hasDue = dueCount > 0;

  return (
    <article className="rounded-xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
      <Tabs defaultValue="recent">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">Work Activity</h2>
            <p className="text-sm text-neutral-600">
              Track recent updates and upcoming deadlines in one place.
            </p>
          </div>
          <TabsList className="self-start bg-neutral-100">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            {hasDue ? <TabsTrigger value="due">Due Soon</TabsTrigger> : null}
          </TabsList>
        </div>

        <TabsContent value="recent" className="mt-4 space-y-3">
          {recentPreview.length === 0 ? (
            <p className="text-sm text-neutral-600">No recent tasks yet. Create your first task.</p>
          ) : (
            recentPreview.map((task) => {
              const priority = resolvePriority(task.priority);
              const priorityLabel = priority ? TASK_PRIORITY_LABELS[priority] : null;
              const priorityClass = priority ? resolvePriorityBadgeClass(priority) : null;

              return (
                <div
                  key={task.id}
                  className="border-b border-black/5 pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm text-neutral-900">{task.title}</p>
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
        </TabsContent>

        {hasDue ? (
          <TabsContent value="due" className="mt-4 space-y-3">
            {duePreview.map((task) => {
              const priority = resolvePriority(task.priority);
              const priorityLabel = priority ? TASK_PRIORITY_LABELS[priority] : null;
              const priorityClass = priority ? resolvePriorityBadgeClass(priority) : null;

              return (
                <div
                  key={task.id}
                  className="border-b border-black/5 pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm text-neutral-900">{task.title}</p>
                      <p className="line-clamp-1 text-xs text-neutral-600">
                        Due {formatTaskDate(task.dueDate)}
                      </p>
                    </div>
                    {priority && priorityLabel && priorityClass ? (
                      <Badge className={priorityClass}>{priorityLabel}</Badge>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        ) : null}
      </Tabs>
    </article>
  );
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
    const todoProjects = projectStatusCounts.todo;
    const inProgressProjects = projectStatusCounts.in_progress;
    const completedProjects = projectStatusCounts.done;

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      totalProjects,
      todoProjects,
      inProgressProjects,
      completedProjects,
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
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
                <p className="text-sm text-neutral-600">Overview of your tasks and projects.</p>
              </div>
              <div className="ml-auto flex gap-4 text-sm">
                <Link to="/tasks" className="text-yellow-700 transition hover:text-yellow-600">
                  Tasks
                </Link>
                <Link to="/projects" className="text-yellow-700 transition hover:text-yellow-600">
                  Projects
                </Link>
                <Link
                  to="/tasks?view=board"
                  className="text-yellow-700 transition hover:text-yellow-600"
                >
                  Board
                </Link>
              </div>
            </header>

            <div className="mt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {stats.totalTasks > 0 ? (
                  <TasksOverviewCard
                    totalTasks={stats.totalTasks}
                    completionRate={stats.completionRate}
                    todoTasks={stats.todoTasks}
                    inProgressTasks={stats.inProgressTasks}
                    completedTasks={stats.completedTasks}
                  />
                ) : (
                  <EmptyOverviewCard
                    title="No tasks yet"
                    description="Create your first task to start tracking progress."
                    actionLabel="Create Task"
                    actionTo="/tasks"
                  />
                )}

                {stats.totalProjects > 0 ? (
                  <ProjectsOverviewCard
                    totalProjects={stats.totalProjects}
                    completionRate={stats.projectCompletionRate}
                    todoProjects={stats.todoProjects}
                    inProgressProjects={stats.inProgressProjects}
                    completedProjects={stats.completedProjects}
                  />
                ) : (
                  <EmptyOverviewCard
                    title="No projects yet"
                    description="Launch a project to organize related workstreams."
                    actionLabel="Create Project"
                    actionTo="/projects"
                  />
                )}
              </div>

              <div className="mt-6">
                <WorkActivityTabs recentTasks={recentTasks} upcomingTasks={upcomingTasks} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link to="/tasks">Create Task</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/projects">Create Project</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
