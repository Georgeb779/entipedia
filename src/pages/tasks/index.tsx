import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Spinner,
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
import type { Project, Task, TaskFilters, TaskFormValues, TaskPriority, TaskStatus } from "@/types";
import { cn, formatDateForInput, formatTaskDate } from "@/utils";

const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es requerido.")
    .max(255, "El título debe tener 255 caracteres o menos."),
  description: z
    .string()
    .max(2000, "La descripción debe tener 2000 caracteres o menos.")
    .optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.union([z.enum(["low", "medium", "high"]), z.literal("none")]).optional(),
  dueDate: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Fecha de Vencimiento no válida.",
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
        message: "Selección de proyecto no válida.",
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
  value === "table" ? "table" : "board";

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
        mutationError instanceof Error ? mutationError.message : "No se pudo crear la tarea.";
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
        mutationError instanceof Error ? mutationError.message : "No se pudo actualizar la tarea.";
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
        mutationError instanceof Error ? mutationError.message : "No se pudo eliminar la tarea.";
      setDeleteError(message);
    }
  };

  const handleViewChange = useCallback(
    (value: string) => {
      const nextView = resolveViewMode(value);
      const currentParam = searchParams.get("view");
      if (nextView === activeView) {
        if (nextView === "board" && !currentParam) {
          return;
        }

        if (nextView === "table" && currentParam === "table") {
          return;
        }
      }

      const nextParams = new URLSearchParams(searchParams);
      if (nextView === "board") {
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

  const projectNameMap = useMemo(() => {
    const map = new Map<number, string>();

    projects.forEach((project) => {
      const trimmedName = project.name.trim();
      map.set(project.id, trimmedName.length > 0 ? trimmedName : "Proyecto sin título");
    });

    return map;
  }, [projects]);

  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  const refreshScrollIndicators = useCallback(() => {
    const container = tableScrollRef.current;

    if (!container) {
      setShowLeftIndicator(false);
      setShowRightIndicator(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftIndicator(scrollLeft > 0);
    setShowRightIndicator(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = tableScrollRef.current;
    const frame = window.requestAnimationFrame(() => {
      refreshScrollIndicators();
    });

    if (!container) {
      window.addEventListener("resize", refreshScrollIndicators);
      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", refreshScrollIndicators);
      };
    }

    const handleScroll = () => {
      refreshScrollIndicators();
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", refreshScrollIndicators);

    return () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", refreshScrollIndicators);
    };
  }, [activeTasks, refreshScrollIndicators]);

  type TaskMobileCardProps = {
    task: Task;
    projects: ReadonlyArray<Project>;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    isUpdating: boolean;
    className?: string;
  };

  const TaskMobileCard = ({
    task,
    projects: projectList,
    onEdit,
    onDelete,
    isUpdating,
    className,
  }: TaskMobileCardProps) => {
    const projectName =
      task.projectId !== null
        ? (projectList.find((project) => project.id === task.projectId)?.name ?? "Desconocido")
        : "Sin asignar";
    const priority = task.priority && isTaskPriority(task.priority) ? task.priority : null;

    return (
      <article
        className={cn(
          "animate-card-fade-in space-y-3 rounded-lg border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm",
          className,
        )}
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-[#1C2431]">{task.title}</h3>
            {task.description ? (
              <p className="text-muted-foreground line-clamp-2 text-xs">{task.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("text-xs", TASK_STATUS_COLORS[task.status])}>
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
            {priority ? (
              <Badge className={cn("text-xs", TASK_PRIORITY_COLORS[priority])}>
                {TASK_PRIORITY_LABELS[priority]}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs">Sin prioridad</span>
            )}
          </div>
        </header>

        <dl className="grid gap-3 text-xs sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-medium">Proyecto:</dt>
            <dd className="text-foreground text-sm">{projectName}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-medium">Vencimiento:</dt>
            <dd className="text-foreground text-sm">{formatTaskDate(task.dueDate)}</dd>
          </div>
        </dl>

        <footer className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(task)} disabled={isUpdating}>
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(task)}
            disabled={isUpdating}
          >
            Eliminar
          </Button>
        </footer>
      </article>
    );
  };

  const renderTaskRows = () => {
    if (activeTasks.length === 0) {
      return (
        <TableRow>
          <TableCell className="py-10 text-center" colSpan={6}>
            <p className="text-muted-foreground text-sm">
              No hay tareas que coincidan con los filtros actuales.
            </p>
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
              ? (projects.find((project) => project.id === task.projectId)?.name ?? "Desconocido")
              : "Sin asignar"}
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
              <span className="text-muted-foreground text-sm">Sin prioridad</span>
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
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteTask(task)}
                disabled={deleteTask.isPending && taskBeingDeleted?.id === task.id}
              >
                Eliminar
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
        <div className="text-foreground px-0 sm:py-4 md:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Tabs value={activeView} onValueChange={handleViewChange}>
              <header className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold">Tareas</h1>
                  <p className="text-muted-foreground text-sm">
                    Gestiona tu trabajo con estatus, prioridades y fechas límite.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:w-auto lg:flex-nowrap">
                  <TabsList className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row sm:gap-0">
                    <TabsTrigger value="board" className="h-10 text-sm sm:w-auto">
                      Tablero
                    </TabsTrigger>
                    <TabsTrigger value="table" className="h-10 text-sm sm:w-auto">
                      Tabla
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    onClick={openCreateModal}
                    variant="secondary"
                    className="w-full sm:w-auto lg:w-auto"
                  >
                    Crear tarea
                  </Button>
                </div>
              </header>

              <section className="flex flex-col gap-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:gap-4 md:p-5">
                <div className="w-full sm:max-w-xs">
                  <Label className="text-muted-foreground mb-2 block text-sm">Estatus</Label>
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
                      <SelectValue placeholder="Filtrar por estatus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {TASK_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:max-w-xs">
                  <Label className="text-muted-foreground mb-2 block text-sm">Prioridad</Label>
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
                      <SelectValue placeholder="Filtrar por prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {TASK_PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:max-w-xs">
                  <Label className="text-muted-foreground mb-2 block text-sm">Proyecto</Label>
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
                      <SelectValue placeholder="Filtrar por proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
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
                <section className="mt-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-5 shadow-sm md:p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="lg" label="Cargando tareas..." />
                    </div>
                  ) : error ? (
                    <div className="text-destructive py-12 text-center">
                      {error instanceof Error ? error.message : "No se pudieron cargar las tareas."}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 xl:hidden">
                        {activeTasks.length === 0 ? (
                          <p className="text-muted-foreground py-8 text-center text-sm">
                            No hay tareas que coincidan con los filtros actuales.
                          </p>
                        ) : (
                          activeTasks.map((task, index) => {
                            const isEditing =
                              updateTask.isPending && taskBeingEdited?.id === task.id;
                            const isDeleting =
                              deleteTask.isPending && taskBeingDeleted?.id === task.id;
                            const isMutating = isEditing || isDeleting;

                            return (
                              <TaskMobileCard
                                key={task.id}
                                task={task}
                                projects={projects}
                                onEdit={handleEditOpen}
                                onDelete={handleDeleteTask}
                                isUpdating={isMutating}
                                className={index < 4 ? `stagger-${index + 1}` : undefined}
                              />
                            );
                          })
                        )}
                      </div>

                      <div className="relative hidden xl:block">
                        {showLeftIndicator ? <span className="scroll-indicator-left" /> : null}
                        {showRightIndicator ? <span className="scroll-indicator-right" /> : null}
                        <div ref={tableScrollRef} className="horizontal-scroll-container">
                          <Table className="w-full table-auto">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tarea</TableHead>
                                <TableHead>Proyecto</TableHead>
                                <TableHead>Estatus</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Fecha de Vencimiento</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>{renderTaskRows()}</TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="board" className="mt-0 border-0 bg-transparent p-0">
                <section className="mt-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4 shadow-sm md:p-5">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="lg" label="Cargando tareas..." />
                    </div>
                  ) : error ? (
                    <div className="text-destructive py-12 text-center">
                      {error instanceof Error ? error.message : "No se pudieron cargar las tareas."}
                    </div>
                  ) : activeTasks.length === 0 ? (
                    <div className="text-muted-foreground py-12 text-center">
                      No hay tareas que coincidan con los filtros actuales.
                    </div>
                  ) : (
                    <KanbanBoard
                      tasks={activeTasks}
                      onTaskStatusChange={handleTaskStatusChange}
                      isUpdating={updateTaskStatus.isPending}
                      onEditTask={handleEditOpen}
                      onDeleteTask={handleDeleteTask}
                      projectNames={projectNameMap}
                    />
                  )}
                </section>
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  Puedes reordenar con mouse o teclado (Tab + flechas + Espacio/Enter) y, en
                  pantallas pequeñas, usar el menú “Mover a” de cada tarjeta para cambiar su
                  estatus.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <Dialog open={isCreateModalOpen} onOpenChange={handleCreateOpenChange}>
            <DialogContent className="max-h-[90vh] space-y-4 overflow-y-auto sm:space-y-5">
              <DialogHeader>
                <DialogTitle>Crear tarea</DialogTitle>
              </DialogHeader>

              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título de la tarea" {...field} />
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
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción opcional"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estatus</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estatus" />
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
                          <FormLabel>Prioridad</FormLabel>
                          <Select
                            value={field.value ?? "none"}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar prioridad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin prioridad</SelectItem>
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
                        <FormLabel>Proyecto</FormLabel>
                        <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin proyecto</SelectItem>
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
                        <FormLabel>Fecha de Vencimiento</FormLabel>
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

                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" variant="secondary" disabled={createTask.isPending}>
                      {createTask.isPending ? "Creando..." : "Crear"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditModalOpen} onOpenChange={handleEditOpenChange}>
            <DialogContent className="max-h-[90vh] space-y-4 overflow-y-auto sm:space-y-5">
              <DialogHeader>
                <DialogTitle>Editar tarea</DialogTitle>
              </DialogHeader>

              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título de la tarea" {...field} />
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
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción opcional"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estatus</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estatus" />
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
                          <FormLabel>Prioridad</FormLabel>
                          <Select
                            value={field.value ?? "none"}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar prioridad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin prioridad</SelectItem>
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
                        <FormLabel>Proyecto</FormLabel>
                        <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin proyecto</SelectItem>
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
                        <FormLabel>Fecha de Vencimiento</FormLabel>
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

                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={closeEditModal}>
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" variant="secondary" disabled={updateTask.isPending}>
                      {updateTask.isPending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteModalOpen} onOpenChange={handleDeleteOpenChange}>
            <DialogContent className="space-y-5">
              <DialogHeader>
                <DialogTitle>Eliminar tarea</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground text-sm">
                ¿Seguro que deseas eliminar "{taskBeingDeleted?.title ?? "esta tarea"}"? Esta acción
                no se puede deshacer.
              </p>
              {deleteError ? <p className="text-destructive text-sm">{deleteError}</p> : null}
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleConfirmDelete()}
                  disabled={deleteTask.isPending}
                >
                  {deleteTask.isPending ? "Eliminando..." : "Eliminar"}
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
