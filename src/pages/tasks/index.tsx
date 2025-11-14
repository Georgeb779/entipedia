import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button, KanbanBoard, Layout, ProtectedRoute } from "@/components";
import type { CardRenderProps } from "@/components/kanban-board";
import {
  Badge,
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
  usePersistentViewMode,
  useProjects,
  useTasks,
  useUpdateTask,
  useUpdateTaskStatus,
} from "@/hooks";
import type { Project, Task, TaskFilters, TaskStatus } from "@/types";
import { cn, formatTaskDate } from "@/utils";

import { TaskBoardCard, TaskBoardCardPreview } from "./task-board-card";
import { DeleteTaskDialog, TaskFormModal } from "./task-modals";
import {
  defaultFormValues,
  isTaskPriority,
  mapSchemaToTask,
  resolveTaskBoardStatus,
  resolveViewMode,
  taskSchema,
  TASK_BOARD_STATUSES,
  TASK_BOARD_STATUS_TITLES,
  toSchemaValues,
  type TaskViewMode,
  type TaskFormSchema,
} from "./task-schema";

function TasksPage() {
  const [activeView, setActiveView] = usePersistentViewMode<TaskViewMode>({
    storageKey: "tasks:view-mode",
    paramName: "view",
    resolve: resolveViewMode,
  });
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

  const handleEditOpen = useCallback(
    (task: Task) => {
      setTaskBeingEdited(task);
      editForm.reset(toSchemaValues(task));
      editForm.clearErrors();
      setIsEditModalOpen(true);
    },
    [editForm],
  );

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

  const handleDeleteTask = useCallback((task: Task) => {
    setTaskBeingDeleted(task);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  }, []);

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

      if (nextView !== activeView) {
        setActiveView(nextView);
      }
    },
    [activeView, setActiveView],
  );

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
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
    const map = new Map<string, string>();

    projects.forEach((project) => {
      const trimmedName = project.name.trim();
      map.set(project.id, trimmedName.length > 0 ? trimmedName : "Proyecto sin título");
    });

    return map;
  }, [projects]);

  const getTaskTitle = useCallback((task: Task) => task.title, []);

  const renderTaskBoardCard = useCallback(
    (props: CardRenderProps<Task, TaskStatus>) => {
      const projectName =
        props.item.projectId !== null ? (projectNameMap.get(props.item.projectId) ?? null) : null;

      return (
        <TaskBoardCard
          {...props}
          projectName={projectName}
          onEditTask={handleEditOpen}
          onDeleteTask={handleDeleteTask}
        />
      );
    },
    [handleDeleteTask, handleEditOpen, projectNameMap],
  );

  const renderTaskBoardPreview = useCallback(
    (task: Task) => {
      const projectName =
        task.projectId !== null ? (projectNameMap.get(task.projectId) ?? null) : null;

      return <TaskBoardCardPreview task={task} projectName={projectName} />;
    },
    [projectNameMap],
  );

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
          "space-y-3 rounded-lg border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm",
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
          <TableCell className="text-foreground max-w-[150px] text-sm font-medium">
            <div className="truncate" title={task.title}>
              {task.title}
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground max-w-[140px] text-sm">
            <div
              className="truncate"
              title={
                task.projectId !== null
                  ? (projects.find((project) => project.id === task.projectId)?.name ??
                    "Desconocido")
                  : "Sin asignar"
              }
            >
              {task.projectId !== null
                ? (projects.find((project) => project.id === task.projectId)?.name ?? "Desconocido")
                : "Sin asignar"}
            </div>
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
            <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
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
              <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:flex-nowrap">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold">Tareas</h1>
                  <p className="text-muted-foreground text-sm">
                    Gestiona tu trabajo con estatus, prioridades y fechas límite.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:flex-col-reverse lg:flex-nowrap lg:items-end">
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
                    className="w-full sm:ml-3 sm:w-auto lg:ml-4"
                  >
                    Crear tarea
                  </Button>
                </div>
              </header>

              <section className="grid gap-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4 shadow-sm sm:grid-cols-2 sm:gap-4 md:p-5 lg:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-sm">Estatus</Label>
                  <Select
                    value={filters.status ?? "all"}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        status: value as TaskFilters["status"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full">
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
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-sm">Prioridad</Label>
                  <Select
                    value={filters.priority ?? "all"}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        priority: value as TaskFilters["priority"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full">
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

                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-sm">Proyecto</Label>
                  <Select
                    value={
                      filters.projectId === undefined || filters.projectId === null
                        ? "all"
                        : filters.projectId === "all"
                          ? "all"
                          : filters.projectId
                    }
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        projectId: value === "all" ? "all" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Filtrar por proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id} title={project.name}>
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
                      <div className="space-y-3 will-change-transform xl:hidden">
                        {activeTasks.length === 0 ? (
                          <p className="text-muted-foreground py-8 text-center text-sm">
                            No hay tareas que coincidan con los filtros actuales.
                          </p>
                        ) : (
                          activeTasks.map((task) => {
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
                              />
                            );
                          })
                        )}
                      </div>

                      <div className="relative hidden xl:block">
                        {showLeftIndicator ? (
                          <div
                            className="scroll-indicator scroll-indicator-left"
                            aria-hidden="true"
                          />
                        ) : null}
                        {showRightIndicator ? (
                          <div
                            className="scroll-indicator scroll-indicator-right"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div ref={tableScrollRef} className="horizontal-scroll-container w-full">
                          <Table className="min-w-max table-auto">
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
                      items={activeTasks}
                      statuses={TASK_BOARD_STATUSES}
                      statusTitles={TASK_BOARD_STATUS_TITLES}
                      emptyColumnMessage="No hay tareas en esta columna"
                      resolveStatus={resolveTaskBoardStatus}
                      onStatusChange={handleTaskStatusChange}
                      getItemTitle={getTaskTitle}
                      renderCard={renderTaskBoardCard}
                      renderPreview={renderTaskBoardPreview}
                      isUpdating={updateTaskStatus.isPending}
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

          <TaskFormModal
            mode="create"
            open={isCreateModalOpen}
            onOpenChange={handleCreateOpenChange}
            form={createForm}
            onSubmit={handleCreateSubmit}
            projects={projects}
            isPending={createTask.isPending}
          />

          <TaskFormModal
            mode="edit"
            open={isEditModalOpen}
            onOpenChange={handleEditOpenChange}
            form={editForm}
            onSubmit={handleEditSubmit}
            projects={projects}
            isPending={updateTask.isPending}
          />

          <DeleteTaskDialog
            open={isDeleteModalOpen}
            onOpenChange={handleDeleteOpenChange}
            taskTitle={taskBeingDeleted?.title ?? "esta tarea"}
            error={deleteError}
            isPending={deleteTask.isPending}
            onConfirm={() => void handleConfirmDelete()}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export default TasksPage;
