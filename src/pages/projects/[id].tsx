import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components";
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
import { useAuth, useDeleteProject, useProject } from "@/hooks";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from "@/constants";
import type { Task, TaskPriority } from "@/types";
import { calculateProjectProgress, formatTaskDate } from "@/utils";

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const projectId = Number.parseInt(id ?? "", 10);

  useEffect(() => {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      navigate("/projects", { replace: true });
    }
  }, [navigate, projectId]);

  const { data, isLoading, error } = useProject(projectId);
  const deleteProject = useDeleteProject();

  useEffect(() => {
    if (auth.status === "unauthenticated") {
      navigate("/auth/login", { replace: true });
    }
  }, [auth.status, navigate]);

  if (auth.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Checking session...</p>
      </div>
    );
  }

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="space-y-4 text-center">
          <p className="text-lg text-red-400">
            {error instanceof Error ? error.message : "Failed to load project."}
          </p>
          <Button variant="secondary" onClick={() => navigate("/projects", { replace: true })}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    navigate("/projects", { replace: true });
    return null;
  }

  const { project, tasks } = data;
  const progress = calculateProjectProgress(
    tasks.filter((task) => task.status === "done").length,
    tasks.length,
  );

  const handleEditProject = () => {
    navigate("/projects", { state: { editProjectId: project.id } });
  };

  const handleDeleteProject = async () => {
    const confirmed = window.confirm(
      `Delete project "${project.name}"? This will remove all tasks in the project as well.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject.mutateAsync(project.id);
      navigate("/projects", { replace: true });
    } catch (mutationError) {
      window.alert(
        mutationError instanceof Error ? mutationError.message : "Failed to delete project.",
      );
    }
  };

  const resolvePriority = (priority: Task["priority"]): TaskPriority | null => {
    if (!priority) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(TASK_PRIORITY_LABELS, priority)) {
      return priority as TaskPriority;
    }

    return null;
  };

  const renderTaskRow = (task: Task) => {
    const resolvedPriority = resolvePriority(task.priority);
    const priorityLabel = resolvedPriority ? TASK_PRIORITY_LABELS[resolvedPriority] : "None";
    const priorityClass = resolvedPriority ? TASK_PRIORITY_COLORS[resolvedPriority] : "bg-gray-700";

    return (
      <TableRow key={task.id}>
        <TableCell>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{task.title}</p>
            {task.description ? <p className="text-sm text-gray-400">{task.description}</p> : null}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={TASK_STATUS_COLORS[task.status]}>
            {TASK_STATUS_LABELS[task.status]}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge className={priorityClass}>{priorityLabel}</Badge>
        </TableCell>
        <TableCell>{formatTaskDate(task.dueDate)}</TableCell>
        <TableCell className="text-right">
          <Link to="/tasks" className="text-blue-400 hover:underline">
            Manage Tasks
          </Link>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/projects")}>
            ← Back to Projects
          </Button>
          <div className="flex gap-2">
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

        <Card>
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>{project.description ?? "No description provided."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <p>Created {formatTaskDate(project.createdAt)}</p>
            <p>Updated {formatTaskDate(project.updatedAt)}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="bg-gray-800">
            <div className="space-y-6">
              <Card className="bg-transparent">
                <CardHeader>
                  <CardTitle>Project Statistics</CardTitle>
                  <CardDescription>Understand how this project is progressing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                    <Badge className="bg-blue-600">
                      {tasks.length} total {tasks.length === 1 ? "task" : "tasks"}
                    </Badge>
                    <Badge className="bg-green-600">
                      {tasks.filter((task) => task.status === "done").length} completed
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Progress</p>
                    <div className="h-2 w-full rounded-full bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{progress}% complete</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="bg-gray-800">
            {tasks.length === 0 ? (
              <div className="rounded-lg bg-gray-900 p-8 text-center text-gray-400">
                <p>No tasks in this project yet. Create tasks and assign them to this project.</p>
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
  );
};

export default ProjectDetailPage;
