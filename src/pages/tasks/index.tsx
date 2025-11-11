import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components";
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
  useAuth,
  useCreateTask,
  useDeleteTask,
  useProjects,
  useTasks,
  useUpdateTask,
} from "@/hooks";
import type { Task, TaskFilters, TaskFormValues, TaskPriority } from "@/types";
import { formatDateForInput, formatTaskDate } from "@/utils";

const taskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(255, "Title must be 255 characters or less."),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or less.")
      .optional()
      .nullable(),
    status: z.enum(["todo", "in_progress", "done"]),
    priority: z.enum(["low", "medium", "high"]).optional().nullable(),
    dueDate: z
      .string()
      .optional()
      .nullable()
      .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
        message: "Invalid due date.",
      }),
    projectId: z.number().optional().nullable(),
  })
  .transform((values) => ({
    ...values,
    title: values.title.trim(),
    description: values.description ? values.description.trim() : null,
    priority: values.priority ?? null,
    dueDate: values.dueDate && values.dueDate.length > 0 ? values.dueDate : null,
    projectId: values.projectId ?? null,
  }));

type TaskSchema = z.infer<typeof taskSchema>;

const defaultFormValues: TaskSchema = {
  title: "",
  description: null,
  status: "todo",
  priority: null,
  dueDate: null,
  projectId: null,
};

const defaultFilters: TaskFilters = {
  status: "all",
  priority: "all",
};

const mapSchemaToFormValues = (values: TaskSchema): TaskFormValues => ({
  title: values.title,
  description: values.description,
  status: values.status,
  priority: values.priority,
  dueDate: values.dueDate,
  projectId: values.projectId,
});

const normalizePriority = (priority: Task["priority"]): TaskPriority | null => {
  if (priority === "low" || priority === "medium" || priority === "high") {
    return priority;
  }

  return null;
};

const mapTaskToFormValues = (task: Task): TaskSchema => ({
  title: task.title,
  description: task.description ?? null,
  status: task.status,
  priority: normalizePriority(task.priority),
  dueDate: task.dueDate ? formatDateForInput(task.dueDate) : null,
  projectId: task.projectId ?? null,
});

const getPriorityDisplay = (priority: TaskPriority | null) => {
  if (!priority) {
    return null;
  }

  return <Badge className={TASK_PRIORITY_COLORS[priority]}>{TASK_PRIORITY_LABELS[priority]}</Badge>;
};

const StatusBadge = ({ status }: { status: Task["status"] }) => (
  <Badge className={TASK_STATUS_COLORS[status]}>{TASK_STATUS_LABELS[status]}</Badge>
);

const TasksPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (auth.status === "unauthenticated") {
      navigate("/auth/login", { replace: true });
    }
  }, [auth.status, navigate]);

  const { data: tasks = [], isLoading, error } = useTasks(filters);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projects = [] } = useProjects();

  const projectLookup = useMemo(() => {
    return projects.reduce<Map<number, string>>((lookup, project) => {
      lookup.set(project.id, project.name);
      return lookup;
    }, new Map());
  }, [projects]);

  const createForm = useForm<TaskSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<TaskSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (editingTask) {
      editForm.reset(mapTaskToFormValues(editingTask));
    }
  }, [editingTask, editForm]);

  const resetCreateForm = useCallback(() => {
    createForm.reset(defaultFormValues);
  }, [createForm]);

  const openCreateModal = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleCreateOpenChange = (open: boolean) => {
    setIsCreateModalOpen(open);

    if (!open) {
      resetCreateForm();
      createForm.clearErrors();
    }
  };

  const handleEditOpenChange = (open: boolean) => {
    setIsEditModalOpen(open);

    if (!open) {
      setEditingTask(null);
      editForm.clearErrors();
    }
  };

  const handleCreateSubmit = async (values: TaskSchema) => {
    createForm.clearErrors("root");
    const payload = mapSchemaToFormValues(values);

    try {
      await createTask.mutateAsync(payload);
      closeCreateModal();
      resetCreateForm();
    } catch (mutationError) {
      createForm.setError("root", {
        type: "server",
        message: mutationError instanceof Error ? mutationError.message : "Failed to create task.",
      });
    }
  };

  const handleEditSubmit = async (values: TaskSchema) => {
    if (!editingTask) {
      return;
    }

    editForm.clearErrors("root");
    const payload = mapSchemaToFormValues(values);

    try {
      await updateTask.mutateAsync({ taskId: editingTask.id, data: payload });
      closeEditModal();
    } catch (mutationError) {
      editForm.setError("root", {
        type: "server",
        message: mutationError instanceof Error ? mutationError.message : "Failed to update task.",
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this task?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteTask.mutateAsync(taskId);
    } catch (mutationError) {
      // Surface delete errors via alert for now to keep UX simple.
      window.alert(
        mutationError instanceof Error ? mutationError.message : "Failed to delete task.",
      );
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const renderTaskRows = () => {
    if (!tasks.length) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-12 text-center text-gray-400">
            No tasks found.
          </TableCell>
        </TableRow>
      );
    }

    return tasks.map((task) => (
      <TableRow key={task.id}>
        <TableCell>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{task.title}</p>
            {task.description ? (
              <p className="max-w-xl text-sm text-gray-400">{task.description}</p>
            ) : null}
          </div>
        </TableCell>
        <TableCell>
          {task.projectId ? (projectLookup.get(task.projectId) ?? "Unknown project") : "No project"}
        </TableCell>
        <TableCell>
          <StatusBadge status={task.status} />
        </TableCell>
        <TableCell>{getPriorityDisplay(normalizePriority(task.priority))}</TableCell>
        <TableCell>{formatTaskDate(task.dueDate)}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => handleEditClick(task)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteTask(task.id)}>
              Delete
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  if (auth.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Checking session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold">Tasks</h1>
            <p className="text-sm text-gray-400">
              Manage your work with statuses, priorities, and due dates.
            </p>
          </div>
          <Button onClick={openCreateModal} variant="secondary">
            Create Task
          </Button>
        </header>

        <section className="flex flex-wrap gap-4 rounded-lg bg-gray-800 p-4">
          <div className="w-full max-w-xs">
            <label className="mb-2 block text-sm font-medium text-gray-300">Status</label>
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
            <label className="mb-2 block text-sm font-medium text-gray-300">Priority</label>
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
        </section>

        <section className="rounded-lg bg-gray-800 p-6">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">Loading tasks...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-400">
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
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent>
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
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? null : (value as TaskPriority))
                        }
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
                    <Select
                      value={
                        field.value !== null && field.value !== undefined
                          ? field.value.toString()
                          : "none"
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : Number.parseInt(value, 10))
                      }
                    >
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
                      <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {createForm.formState.errors.root ? (
                <p className="text-sm text-red-400">{createForm.formState.errors.root.message}</p>
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
        <DialogContent>
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
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? null : (value as TaskPriority))
                        }
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
                    <Select
                      value={
                        field.value !== null && field.value !== undefined
                          ? field.value.toString()
                          : "none"
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : Number.parseInt(value, 10))
                      }
                    >
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
                      <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
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
    </div>
  );
};

export default TasksPage;
