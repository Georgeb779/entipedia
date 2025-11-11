import { useMemo } from "react";
import { Link } from "react-router";
import { CheckSquare, Clock, FolderKanban, TrendingUp } from "lucide-react";

import { Layout, ProtectedRoute } from "@/components";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@/components/ui";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from "@/constants";
import { useProjects, useTasks } from "@/hooks";
import type { Task, TaskPriority } from "@/types";
import { formatTaskDate } from "@/utils";

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
    const tasksWithDueDate = tasks.filter((task) => task.dueDate !== null).length;

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      totalProjects,
      tasksWithDueDate,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
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
          <div className="flex min-h-screen items-center justify-center text-gray-400">
            <p>Loading dashboard...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="px-6 py-10">
          <header className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">Overview of your tasks and projects.</p>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="space-y-3 p-6">
                <div className="inline-flex rounded-full bg-blue-600/20 p-3 text-blue-400">
                  <CheckSquare className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.totalTasks}</p>
                  <p className="text-sm text-gray-400">Total Tasks</p>
                </div>
                <p className="text-xs text-gray-500">{stats.completionRate}% completed</p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="space-y-3 p-6">
                <div className="inline-flex rounded-full bg-purple-600/20 p-3 text-purple-400">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.inProgressTasks}</p>
                  <p className="text-sm text-gray-400">In Progress</p>
                </div>
                <p className="text-xs text-gray-500">{stats.todoTasks} to do</p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="space-y-3 p-6">
                <div className="inline-flex rounded-full bg-green-600/20 p-3 text-green-400">
                  <FolderKanban className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
                  <p className="text-sm text-gray-400">Projects</p>
                </div>
                <Button asChild variant="link" className="px-0 text-sm text-blue-400">
                  <Link to="/projects">View projects →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="space-y-3 p-6">
                <div className="inline-flex rounded-full bg-amber-500/20 p-3 text-amber-400">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{upcomingTasks.length}</p>
                  <p className="text-sm text-gray-400">Due Soon</p>
                </div>
                <p className="text-xs text-gray-500">Tasks with upcoming due dates</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Tasks</CardTitle>
                <CardDescription>Your latest tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTasks.length === 0 ? (
                  <p className="text-sm text-gray-400">No tasks yet. Create your first task!</p>
                ) : (
                  recentTasks.map((task, index) => {
                    const isLast = index === recentTasks.length - 1;
                    const priority = resolvePriority(task.priority);
                    const priorityLabel = priority ? TASK_PRIORITY_LABELS[priority] : null;
                    const priorityClass = priority ? TASK_PRIORITY_COLORS[priority] : undefined;

                    return (
                      <div key={task.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{task.title}</p>
                            <p className="text-xs text-gray-400">
                              Created {formatTaskDate(task.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={TASK_STATUS_COLORS[task.status]}>
                              {TASK_STATUS_LABELS[task.status]}
                            </Badge>
                            {priority && priorityLabel ? (
                              <Badge className={priorityClass}>{priorityLabel}</Badge>
                            ) : null}
                          </div>
                        </div>
                        {!isLast ? <Separator className="bg-gray-700" /> : null}
                      </div>
                    );
                  })
                )}
              </CardContent>
              <CardContent>
                <Button asChild variant="link" className="px-0 text-sm text-blue-400">
                  <Link to="/tasks">View all tasks →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Upcoming Due Dates</CardTitle>
                <CardDescription>Tasks due soon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-gray-400">No upcoming due dates.</p>
                ) : (
                  upcomingTasks.map((task, index) => {
                    const isLast = index === upcomingTasks.length - 1;
                    const priority = resolvePriority(task.priority);
                    const priorityLabel = priority ? TASK_PRIORITY_LABELS[priority] : null;
                    const priorityClass = priority ? TASK_PRIORITY_COLORS[priority] : undefined;

                    return (
                      <div key={task.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{task.title}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Due {formatTaskDate(task.dueDate)}</span>
                            </div>
                          </div>
                          {priority && priorityLabel ? (
                            <Badge className={priorityClass}>{priorityLabel}</Badge>
                          ) : null}
                        </div>
                        {!isLast ? <Separator className="bg-gray-700" /> : null}
                      </div>
                    );
                  })
                )}
              </CardContent>
              <CardContent>
                <Button asChild variant="link" className="px-0 text-sm text-blue-400">
                  <Link to="/tasks">View all tasks →</Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="mt-8 flex flex-wrap gap-4">
            <Button asChild variant="secondary">
              <Link to="/tasks">Create Task</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/projects">Create Project</Link>
            </Button>
            <Button asChild variant="ghost" className="text-blue-400 hover:text-blue-300">
              <Link to="/kanban">View Kanban</Link>
            </Button>
          </section>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
