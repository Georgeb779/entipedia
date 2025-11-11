import { useCallback, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSearchParams } from "react-router";

import { Button, KanbanBoard, Layout, ProtectedRoute } from "@/components";
import {
  Badge,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from "@/constants";
import {
  useCreateTask,
  useDeleteTask,
  useProjects,
  useTasks,
  useUpdateTask,
  useUpdateTaskStatus,
} from "@/hooks";
import type { Task, TaskFilters, TaskFormValues, TaskPriority, TaskStatus } from "@/types";
import { cn, formatDateForInput, formatTaskDate } from "@/utils";

const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(255, "Title must be 255 characters or less."),
  description: z.string().max(2000, "Description must be 2000 characters or less.").optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.union([z.enum(["low", "medium", "high"]), z.literal("none")]).optional(),
  dueDate: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid due date.",
    }),
  projectId: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        value === "none" ||
        (!Number.isNaN(Number.parseInt(value, 10)) && Number.parseInt(value, 10) >= 0),
      {
        message: "Invalid project selection.",
      },
    ),
});

type TaskFormSchema = z.infer<typeof taskSchema>;

const defaultFormValues: TaskFormSchema = {
  title: "",
  description: "",
  status: "todo",
  priority: "none",
  dueDate: "",
  projectId: "none",
};

const isTaskPriority = (value: string): value is TaskPriority =>
  value === "low" || value === "medium" || value === "high";

const toSchemaValues = (task: Task): TaskFormSchema => ({
  title: task.title,
  description: task.description ?? "",
  status: task.status,
  priority: task.priority && isTaskPriority(task.priority) ? task.priority : "none",
  dueDate: formatDateForInput(task.dueDate),
  projectId: task.projectId !== null ? task.projectId.toString() : "none",
});

const mapSchemaToTask = (values: TaskFormSchema): TaskFormValues => ({
  title: values.title.trim(),
  description:
    values.description && values.description.trim().length > 0 ? values.description.trim() : null,
  status: values.status,
  priority:
    values.priority && values.priority !== "none" && isTaskPriority(values.priority)
      ? values.priority
      : null,
  dueDate: values.dueDate && values.dueDate.length > 0 ? values.dueDate : null,
  projectId:
    values.projectId && values.projectId !== "none" ? Number.parseInt(values.projectId, 10) : null,
});

type TaskViewMode = "table" | "board";

const resolveViewMode = (value: string | null | undefined): TaskViewMode =>
  value === "board" ? "board" : "table";

function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    priority: "all",
    projectId: "all",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskBeingDeleted, setTaskBeingDeleted] = useState<Task | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const activeView = useMemo(() => resolveViewMode(searchParams.get("view")), [searchParams]);

  const { data: tasks = [], isLoading, error } = useTasks(filters);
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateTaskStatus = useUpdateTaskStatus();

  const createForm = useForm<TaskFormSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<TaskFormSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultFormValues,
  });

  const openCreateModal = () => {
    createForm.reset(defaultFormValues);
    createForm.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleCreateOpenChange = (open: boolean) => {
    if (!open) {
      setIsCreateModalOpen(false);
      createForm.reset(defaultFormValues);
      createForm.clearErrors();
      return;
    }

    openCreateModal();
  };

  const handleCreateSubmit = async (values: TaskFormSchema) => {
    try {
      await createTask.mutateAsync(mapSchemaToTask(values));
      setIsCreateModalOpen(false);
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Failed to create task.";
      createForm.setError("root", { message });
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTaskBeingEdited(null);
    editForm.reset(defaultFormValues);
    editForm.clearErrors();
  };

  const handleEditOpen = (task: Task) => {
    setTaskBeingEdited(task);
    editForm.reset(toSchemaValues(task));
    editForm.clearErrors();
    setIsEditModalOpen(true);
  };

  const handleEditOpenChange = (open: boolean) => {
    if (!open) {
      closeEditModal();
      return;
    }

    if (taskBeingEdited) {
      handleEditOpen(taskBeingEdited);
    }
  };

  const handleEditSubmit = async (values: TaskFormSchema) => {
    if (!taskBeingEdited) {
      return;
    }

    try {
      await updateTask.mutateAsync({
        taskId: taskBeingEdited.id,
        data: mapSchemaToTask(values),
      });
      closeEditModal();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Failed to update task.";
      editForm.setError("root", { message });
    }
  };

  const handleDeleteTask = async (task: Task) => {
    setTaskBeingDeleted(task);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) {
      setIsDeleteModalOpen(false);
      setTaskBeingDeleted(null);
      setDeleteError(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskBeingDeleted) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteTask.mutateAsync(taskBeingDeleted.id);
      setIsDeleteModalOpen(false);
      setTaskBeingDeleted(null);
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Failed to delete task.";
      setDeleteError(message);
    }
  };

  const handleViewChange = useCallback(
    (value: string) => {
      const nextView = resolveViewMode(value);
      const currentParam = searchParams.get("view");
      if (nextView === activeView) {
        if (nextView === "table" && !currentParam) {
          return;
        }

        if (nextView === "board" && currentParam === "board") {
          return;
        }
      }

      const nextParams = new URLSearchParams(searchParams);
      if (nextView === "table") {
        nextParams.delete("view");
      } else {
        nextParams.set("view", nextView);
      }

      setSearchParams(nextParams);
    },
    [activeView, searchParams, setSearchParams],
  );

  const handleTaskStatusChange = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      try {
        await updateTaskStatus.mutateAsync({ taskId, status: newStatus });
      } catch {
        // Mutation hook performs optimistic rollback on failure.
      }
    },
    [updateTaskStatus],
  );

  const activeTasks = useMemo(() => tasks, [tasks]);

  const renderTaskRows = () => {
    if (activeTasks.length === 0) {
      return (
        <TableRow>
          <TableCell className="py-10 text-center" colSpan={6}>
            <p className="text-muted-foreground text-sm">No tasks match the current filters.</p>
          </TableCell>
        </TableRow>
      );
    }

    return activeTasks.map((task) => {
      const priority = task.priority && isTaskPriority(task.priority) ? task.priority : null;

      return (
        <TableRow key={task.id}>
          <TableCell className="text-foreground max-w-xs text-sm font-medium">
            {task.title}
          </TableCell>
          <TableCell className="text-muted-foreground text-sm">
            {task.projectId !== null
              ? (projects.find((project) => project.id === task.projectId)?.name ?? "Unknown")
              : "Unassigned"}
          </TableCell>
          <TableCell>
            <Badge className={cn("text-xs", TASK_STATUS_COLORS[task.status])}>
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
          </TableCell>
          <TableCell>
            {priority ? (
              <Badge className={cn("text-xs", TASK_PRIORITY_COLORS[priority])}>
                {TASK_PRIORITY_LABELS[priority]}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm">None</span>
            )}
          </TableCell>
          <TableCell className="text-muted-foreground text-sm">
            {formatTaskDate(task.dueDate)}
          </TableCell>
          <TableCell className="text-right text-sm">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditOpen(task)}
                disabled={updateTask.isPending && taskBeingEdited?.id === task.id}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteTask(task)}
                disabled={deleteTask.isPending && taskBeingDeleted?.id === task.id}
              >
                Delete
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground px-5 py-10 md:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Tabs value={activeView} onValueChange={handleViewChange}>
              <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-3xl font-semibold">Tasks</h1>
                  <p className="text-muted-foreground text-sm">
                    Manage your work with statuses, priorities, and due dates.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <TabsList>
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="board">Board</TabsTrigger>
                  </TabsList>
                  <Button onClick={openCreateModal} variant="secondary">
                    Create Task
                  </Button>
                </div>
              </header>

              <section className="flex flex-wrap gap-5 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-5 shadow-sm md:p-6">
                <div className="w-full max-w-xs">
                  <Label className="text-muted-foreground mb-2 block text-sm">Status</Label>
                  <Select
                    value={filters.status ?? "all"}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        status: value as TaskFilters["status"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {TASK_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full max-w-xs">
                  <Label className="text-muted-foreground mb-2 block text-sm">Priority</Label>
                  <Select
                    value={filters.priority ?? "all"}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        priority: value as TaskFilters["priority"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {TASK_PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full max-w-xs">
                  <Label className="text-muted-foreground mb-2 block text-sm">Project</Label>
                  <Select
                    value={
                      filters.projectId === undefined || filters.projectId === null
                        ? "all"
                        : filters.projectId === "all"
                          ? "all"
                          : filters.projectId.toString()
                    }
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        projectId: value === "all" ? "all" : Number.parseInt(value, 10),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <TabsContent value="table" className="mt-0 border-0 bg-transparent p-0">
                <section className="rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-5 shadow-sm md:p-6">
                  {isLoading ? (
                    <div className="text-muted-foreground py-12 text-center">Loading tasks...</div>
                  ) : error ? (
                    <div className="text-destructive py-12 text-center">
                      {error instanceof Error ? error.message : "Failed to load tasks."}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>{renderTaskRows()}</TableBody>
                    </Table>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="board" className="mt-0 border-0 bg-transparent p-0">
                <section className="rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-5 shadow-sm md:p-6">
                  {isLoading ? (
                    <div className="text-muted-foreground py-12 text-center">Loading tasks...</div>
                  ) : error ? (
                    <div className="text-destructive py-12 text-center">
                      {error instanceof Error ? error.message : "Failed to load tasks."}
                    </div>
                  ) : activeTasks.length === 0 ? (
                    <div className="text-muted-foreground py-12 text-center">
                      No tasks match the current filters.
                    </div>
                  ) : (
                    <KanbanBoard
                      tasks={activeTasks}
                      onTaskStatusChange={handleTaskStatusChange}
                      isUpdating={updateTaskStatus.isPending}
                    />
                  )}
                </section>
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  Use mouse or keyboard (Tab + Arrow keys + Space/Enter) to move tasks between
                  columns.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <Dialog open={isCreateModalOpen} onOpenChange={handleCreateOpenChange}>
            <DialogContent className="space-y-5">
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>

              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Task title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional description"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TASK_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            value={field.value ?? "none"}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {TASK_PRIORITY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {createForm.formState.errors.root ? (
                    <p className="text-sm text-red-400">
                      {createForm.formState.errors.root.message}
                    </p>
                  ) : null}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" variant="secondary" disabled={createTask.isPending}>
                      {createTask.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditModalOpen} onOpenChange={handleEditOpenChange}>
            <DialogContent className="space-y-5">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>

              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Task title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional description"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TASK_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            value={field.value ?? "none"}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {TASK_PRIORITY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {editForm.formState.errors.root ? (
                    <p className="text-sm text-red-400">{editForm.formState.errors.root.message}</p>
                  ) : null}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={closeEditModal}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" variant="secondary" disabled={updateTask.isPending}>
                      {updateTask.isPending ? "Saving..." : "Save changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteModalOpen} onOpenChange={handleDeleteOpenChange}>
            <DialogContent className="space-y-5">
              <DialogHeader>
                <DialogTitle>Delete Task</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete "{taskBeingDeleted?.title ?? "this task"}"? This
                action cannot be undone.
              </p>
              {deleteError ? <p className="text-destructive text-sm">{deleteError}</p> : null}
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleConfirmDelete()}
                  disabled={deleteTask.isPending}
                >
                  {deleteTask.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export default TasksPage;
