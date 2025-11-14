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
import { cn, formatTaskDate } from "@/utils";

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
    <article className="rounded-xl border border-black/5 bg-white p-4 shadow-sm sm:p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-600">Tareas</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">
            {totalTasks.toLocaleString()}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
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
        <p className="mt-2 text-sm text-neutral-600">{safeCompletion}% completado</p>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs text-neutral-700 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:text-sm">
        <span className="rounded-md bg-neutral-100 px-2 py-1 sm:bg-transparent sm:px-0 sm:py-0">
          Por Hacer {todoTasks.toLocaleString()}
        </span>
        <span className="rounded-md bg-neutral-100 px-2 py-1 sm:bg-transparent sm:px-0 sm:py-0">
          En Progreso {inProgressTasks.toLocaleString()}
        </span>
        <span className="rounded-md bg-neutral-100 px-2 py-1 sm:bg-transparent sm:px-0 sm:py-0">
          Completado {completedTasks.toLocaleString()}
        </span>
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
    <article className="rounded-xl border border-black/5 bg-white p-4 shadow-sm sm:p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-600">Proyectos</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">
            {totalProjects.toLocaleString()}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
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
        <p className="mt-2 text-sm text-neutral-600">{safeCompletion}% completado</p>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs text-neutral-700 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:text-sm">
        <span className="rounded-md bg-neutral-100 px-2 py-1 sm:bg-transparent sm:px-0 sm:py-0">
          Por Hacer {todoProjects.toLocaleString()}
        </span>
        <span className="rounded-md bg-neutral-100 px-2 py-1 sm:bg-transparent sm:px-0 sm:py-0">
          En Progreso {inProgressProjects.toLocaleString()}
        </span>
        <span className="rounded-md bg-neutral-100 px-2 py-1 sm:bg-transparent sm:px-0 sm:py-0">
          Completado {completedProjects.toLocaleString()}
        </span>
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
  <article className="rounded-xl border border-black/5 bg-white p-4 shadow-sm sm:p-5 md:p-6">
    <h2 className="text-sm text-neutral-600">{title}</h2>
    <p className="mt-2 text-sm text-neutral-600">{description}</p>
    <Button asChild variant="secondary" className="mt-4 w-full sm:w-auto">
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
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-neutral-900">Actividad de trabajo</h2>
            <p className="text-sm text-neutral-600">
              Sigue las actualizaciones recientes y las próximas fechas límite en un solo lugar.
            </p>
          </div>
          <TabsList className="w-full shrink-0 bg-neutral-100 md:w-auto">
            <TabsTrigger value="recent">Recientes</TabsTrigger>
            {hasDue ? <TabsTrigger value="due">Próximas</TabsTrigger> : null}
          </TabsList>
        </div>

        <TabsContent value="recent" className="mt-4 space-y-3">
          {recentPreview.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Aún no hay tareas recientes. Crea tu primera tarea.
            </p>
          ) : (
            recentPreview.map((task) => {
              const priority = resolvePriority(task.priority);
              const priorityLabel = priority ? TASK_PRIORITY_LABELS[priority] : null;
              const priorityClass = priority ? resolvePriorityBadgeClass(priority) : null;
              const statusClass = resolveStatusBadgeClass(task.status);

              return (
                <div
                  key={task.id}
                  className="border-b border-black/5 pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-neutral-900" title={task.title}>
                        {task.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-neutral-600">
                        Creada {formatTaskDate(task.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end">
                      <Badge className={cn("whitespace-nowrap", statusClass)}>
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                      {priority && priorityLabel && priorityClass ? (
                        <Badge className={cn("whitespace-nowrap", priorityClass)}>
                          {priorityLabel}
                        </Badge>
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
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-neutral-900" title={task.title}>
                        {task.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-neutral-600">
                        Fecha de Vencimiento: {formatTaskDate(task.dueDate)}
                      </p>
                    </div>
                    {priority && priorityLabel && priorityClass ? (
                      <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end">
                        <Badge className={cn("whitespace-nowrap", priorityClass)}>
                          {priorityLabel}
                        </Badge>
                      </div>
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
            <p>Cargando panel...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="bg-[#FFFCF5]">
          <div className="mx-auto max-w-7xl min-w-0 px-4 py-4 md:px-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold">Panel</h1>
                <p className="text-sm text-neutral-600">Resumen de tus tareas y proyectos.</p>
              </div>
              <div className="flex gap-4 text-sm sm:ml-auto">
                <Link to="/tasks" className="text-yellow-700 transition hover:text-yellow-600">
                  Tareas
                </Link>
                <Link to="/projects" className="text-yellow-700 transition hover:text-yellow-600">
                  Proyectos
                </Link>
              </div>
            </header>

            <div className="mt-6">
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
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
                    title="Todavía no hay tareas"
                    description="Crea tu primera tarea para empezar a seguir el progreso."
                    actionLabel="Crear tarea"
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
                    title="Todavía no hay proyectos"
                    description="Inicia un proyecto para organizar los flujos de trabajo relacionados."
                    actionLabel="Crear proyecto"
                    actionTo="/projects"
                  />
                )}
              </div>

              <div className="mt-6">
                <WorkActivityTabs recentTasks={recentTasks} upcomingTasks={upcomingTasks} />
              </div>

              <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button asChild variant="secondary" className="w-full sm:w-auto">
                  <Link to="/tasks">Crear tarea</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/projects">Crear proyecto</Link>
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
