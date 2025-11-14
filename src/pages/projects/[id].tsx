import { JSX, useEffect } from "react";
import { Link, NavigateFunction, useNavigate, useParams } from "react-router";

import { Button, Layout, ProtectedRoute } from "@/components";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useDeleteProject, useProject } from "@/hooks";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from "@/constants";
import type { Task, TaskPriority } from "@/types";
import { calculateProjectProgress, cn, formatTaskDate, formatTaskDateTime } from "@/utils";

function resolvePriorityToken(priority: Task["priority"]): TaskPriority | null {
  if (!priority) return null;
  return Object.prototype.hasOwnProperty.call(TASK_PRIORITY_LABELS, priority)
    ? (priority as TaskPriority)
    : null;
}

export default function ProjectDetailPage(): JSX.Element | null {
  const { id } = useParams();
  const navigate = useNavigate();

  const projectId = id;

  useEffect(() => {
    if (!projectId) {
      navigate("/projects", { replace: true });
    }
  }, [navigate, projectId]);

  if (!projectId) {
    return null;
  }

  return <ProjectDetailContent projectId={projectId} navigate={navigate} />;
}

type ProjectDetailContentProps = {
  projectId: string;
  navigate: NavigateFunction;
};

function ProjectDetailContent({ projectId, navigate }: ProjectDetailContentProps): JSX.Element {
  const { data, isLoading, error } = useProject(projectId);
  const deleteProject = useDeleteProject();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-foreground px-6 py-10">
            <div className="mx-auto flex w-full max-w-5xl justify-center py-12">
              <p className="text-muted-foreground text-sm">Loading project...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-foreground px-6 py-10">
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 text-center">
              <p className="text-destructive text-lg">
                {error instanceof Error ? error.message : "Failed to load project."}
              </p>
              <Button variant="secondary" onClick={() => navigate("/projects", { replace: true })}>
                Back to Projects
              </Button>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!data) {
    navigate("/projects", { replace: true });
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-foreground px-6 py-10">
            <div className="mx-auto flex w-full max-w-5xl justify-center py-12">
              <p className="text-muted-foreground text-sm">Redirecting...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const { project, tasks } = data;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = calculateProjectProgress(doneCount, tasks.length);

  const handleEditProject = () => {
    navigate("/projects", { state: { editProjectId: project.id } });
  };

  const handleDeleteProject = async () => {
    const confirmed = window.confirm(
      `Delete project "${project.name}"? This will remove all tasks in the project as well.`,
    );
    if (!confirmed) return;

    try {
      await deleteProject.mutateAsync(project.id);
      navigate("/projects", { replace: true });
    } catch (mutationError) {
      window.alert(
        mutationError instanceof Error ? mutationError.message : "Failed to delete project.",
      );
    }
  };

  const renderTaskRow = (task: Task) => {
    const resolvedPriority = resolvePriorityToken(task.priority);
    const priorityLabel = resolvedPriority ? TASK_PRIORITY_LABELS[resolvedPriority] : "None";
    const priorityClasses = resolvedPriority
      ? cn("text-xs uppercase", TASK_PRIORITY_COLORS[resolvedPriority])
      : "text-xs uppercase bg-[rgba(28,36,49,0.08)] text-muted-foreground";

    return (
      <TableRow key={task.id}>
        <TableCell className="align-top">
          <div className="space-y-1">
            <p className="text-foreground text-sm font-semibold">{task.title}</p>
            {task.description ? (
              <p className="text-muted-foreground text-sm">{task.description}</p>
            ) : null}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn("text-xs uppercase", TASK_STATUS_COLORS[task.status])}>
            {TASK_STATUS_LABELS[task.status]}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge className={priorityClasses}>{priorityLabel}</Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {task.dueDate ? formatTaskDate(task.dueDate) : <span className="text-xs">No date</span>}
        </TableCell>
        <TableCell className="text-right">
          <Link
            to="/tasks"
            className="max-w-60 truncate text-sm font-medium text-[#1C2431] underline-offset-4 hover:underline ..."
          >
            View
          </Link>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground px-6 py-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={() => navigate("/projects")}
                className="w-full justify-center sm:w-auto"
              >
                ← Back to Projects
              </Button>
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={handleEditProject}>
                  Edit Project
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteProject}
                  disabled={deleteProject.isPending}
                >
                  {deleteProject.isPending ? "Deleting..." : "Delete Project"}
                </Button>
              </div>
            </div>

            <Card className="border border-[rgba(0,0,0,0.06)] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl font-semibold">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  {project.description ?? "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2 text-sm">
                <p>Created {formatTaskDateTime(project.createdAt)}</p>
                <p>Updated {formatTaskDateTime(project.updatedAt)}</p>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  <Card className="border border-[rgba(0,0,0,0.06)] bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-foreground text-xl font-semibold">
                        Project Statistics
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-sm">
                        Understand how this project is progressing.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                        <Badge className="bg-[rgba(28,36,49,0.08)] text-[#1C2431]">
                          {tasks.length} total {tasks.length === 1 ? "task" : "tasks"}
                        </Badge>
                        <Badge className="bg-[#E1F3EA] text-[#1C2431]">{doneCount} completed</Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="text-muted-foreground text-sm">Progress</p>
                        <div className="h-2 w-full rounded-full bg-[rgba(28,36,49,0.08)]">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-muted-foreground text-xs">{progress}% complete</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                {tasks.length === 0 ? (
                  <div className="text-muted-foreground rounded-xl border border-dashed border-[rgba(28,36,49,0.15)] bg-white p-8 text-center">
                    <p>
                      No tasks in this project yet. Create tasks and assign them to this project.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{tasks.map(renderTaskRow)}</TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
