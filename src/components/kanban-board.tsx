import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Circle,
  GripVertical,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/constants";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { cn, formatTaskDate, formatTaskDateTime, resolveStatusValue } from "@/utils";
import { useIsMobile } from "@/hooks";

const STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];
const STATUS_TITLES: Record<TaskStatus, string> = {
  todo: "Por Hacer",
  in_progress: "En Progreso",
  done: "Completado",
};

const resolveTaskStatus = (value: unknown): TaskStatus | null =>
  resolveStatusValue<TaskStatus>(value, STATUSES);

const getStatusTitle = (status: TaskStatus | null | undefined): string | undefined =>
  status ? STATUS_TITLES[status] : undefined;

type TaskBuckets = Record<TaskStatus, Task[]>;

interface KanbanBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  isUpdating?: boolean;
  onViewTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  projectNames?: ReadonlyMap<number, string>;
}

type KanbanColumnProps = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  activeId: number | null;
  isUpdating?: boolean;
  onViewTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  projectNames?: ReadonlyMap<number, string>;
};

type TaskCardProps = {
  task: Task;
  isActive: boolean;
  onViewTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  projectName?: string | null;
  onMoveTaskStatus?: (task: Task, newStatus: TaskStatus) => void;
  showDragHandle?: boolean;
};

type TaskCardLayoutProps = HTMLAttributes<HTMLDivElement> & {
  task: Task;
  onViewTask?: () => void;
  onEditTask?: () => void;
  onDeleteTask?: () => void;
  onMoveTaskStatus?: (newStatus: TaskStatus) => void;
  showActions?: boolean;
  showDragHandle?: boolean;
  isActive?: boolean;
  isDragging?: boolean;
  projectName?: string | null;
};

const STATUS_DISPLAY: Record<
  TaskStatus,
  { Icon: LucideIcon; iconClass: string; badgeClass: string; iconWrapperClass: string }
> = {
  todo: {
    Icon: Circle,
    iconClass: "text-neutral-400",
    badgeClass: "bg-neutral-100 text-neutral-700",
    iconWrapperClass: "bg-neutral-100",
  },
  in_progress: {
    Icon: Clock,
    iconClass: "text-yellow-600",
    badgeClass: "bg-yellow-100 text-yellow-700",
    iconWrapperClass: "bg-yellow-50",
  },
  done: {
    Icon: CheckCircle2,
    iconClass: "text-green-600",
    badgeClass: "bg-green-100 text-green-700",
    iconWrapperClass: "bg-green-50",
  },
};

const PRIORITY_BADGE_STYLES: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-neutral-200 text-neutral-700",
};

const PRIORITY_FALLBACK_CLASS = "bg-neutral-100 text-neutral-600";
const TASK_PROJECT_BADGE_CLASS = "bg-blue-100 text-blue-700";
const TASK_PROJECT_BADGE_FALLBACK_CLASS = "bg-neutral-200 text-neutral-700";
const TASK_PROJECT_NAME_FALLBACK = "Proyecto sin título";

const isTaskPriority = (value: unknown): value is TaskPriority =>
  value === "low" || value === "medium" || value === "high";

const getDueDateInfo = (value: Task["dueDate"]) => {
  if (!value) {
    return { label: "Sin fecha", toneClass: "text-neutral-500" };
  }

  const dueDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(dueDate.getTime())) {
    return { label: "Sin fecha", toneClass: "text-neutral-500" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedDueDate = new Date(dueDate);
  normalizedDueDate.setHours(0, 0, 0, 0);

  const diff = normalizedDueDate.getTime() - today.getTime();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
  const formatted = formatTaskDate(dueDate);

  if (diff < 0) {
    return { label: formatted, toneClass: "text-red-600" };
  }

  if (diff <= threeDaysInMs) {
    return { label: formatted, toneClass: "text-yellow-600" };
  }

  return { label: formatted, toneClass: "text-neutral-700" };
};

const KanbanColumn = ({
  title,
  status,
  tasks,
  activeId,
  isUpdating,
  onViewTask,
  onEditTask,
  onDeleteTask,
  projectNames,
}: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: status, data: { status } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">{title}</h2>
        <span className="inline-flex h-6 min-w-8 items-center justify-center self-start rounded-full border border-neutral-200 bg-neutral-50 px-2 text-[11px] font-semibold text-neutral-700">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        id={status}
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[460px] flex-col gap-3 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[#f8f7f3] p-4 shadow-sm transition-all duration-200 md:min-h-[380px] md:p-3",
            isOver
              ? "drop-zone-active animate-pulse-ring ring-2 ring-yellow-300 ring-offset-1"
              : "drop-zone-idle",
            isUpdating ? "opacity-80" : "",
          )}
          aria-label={`Columna ${title}`}
          aria-busy={Boolean(isUpdating)}
          role="list"
        >
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-muted-foreground flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-[rgba(28,36,49,0.15)] px-3 text-center text-sm">
                No hay tareas en esta columna
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={activeId === task.id}
                onViewTask={onViewTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                projectName={
                  task.projectId !== null ? (projectNames?.get(task.projectId) ?? null) : null
                }
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const TaskCardLayout = forwardRef<HTMLDivElement, TaskCardLayoutProps>(
  (
    {
      task,
      className,
      onViewTask,
      onEditTask,
      onDeleteTask,
      onMoveTaskStatus,
      showActions = true,
      showDragHandle = true,
      isActive = false,
      isDragging = false,
      projectName,
      ...rest
    },
    ref,
  ) => {
    const hasActions = showActions && (onViewTask || onEditTask || onDeleteTask);
    const statusDisplay = STATUS_DISPLAY[task.status];
    const StatusIcon = statusDisplay.Icon;
    const priority = task.priority && isTaskPriority(task.priority) ? task.priority : null;
    const description = task.description?.trim().length
      ? task.description
      : "Sin descripción disponible.";
    const dueDateInfo = getDueDateInfo(task.dueDate);
    const hasProject = task.projectId !== null;

    const resolvedProjectName = hasProject
      ? (projectName ?? TASK_PROJECT_NAME_FALLBACK)
      : "Sin proyecto";

    const projectBadgeClass = hasProject
      ? TASK_PROJECT_BADGE_CLASS
      : TASK_PROJECT_BADGE_FALLBACK_CLASS;

    return (
      <article
        ref={ref}
        className={cn(
          "group relative flex max-w-full flex-col gap-2 rounded-xl border border-black/5 bg-white p-4 text-neutral-900 shadow-sm transition-transform duration-150 ease-out will-change-transform select-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#F6C90E] focus-visible:ring-offset-2 focus-visible:outline-none sm:max-w-[360px] md:p-5",
          isActive ? "ring-2 ring-[#F6C90E] ring-offset-2" : "",
          isDragging ? "z-10 scale-[1.02] shadow-lg" : "",
          className,
        )}
        {...rest}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {showDragHandle ? (
              <div
                aria-label="Arrastrar tarea"
                className="flex h-6 w-6 items-center justify-center rounded-xl"
              >
                <span className="sr-only">Arrastrar tarea</span>
                <GripVertical className="h-5 w-5 text-neutral-400" aria-hidden="true" />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full",
                  statusDisplay.iconWrapperClass,
                )}
              >
                <StatusIcon className={cn("h-4 w-4", statusDisplay.iconClass)} aria-hidden="true" />
              </span>
              {onViewTask ? (
                <button
                  type="button"
                  onClick={onViewTask}
                  className="text-left text-base font-semibold transition-colors hover:text-[#E8B90D] md:text-lg"
                >
                  <span className="line-clamp-1">{task.title}</span>
                </button>
              ) : (
                <span className="line-clamp-1 text-base font-semibold md:text-lg">
                  {task.title}
                </span>
              )}
            </div>
          </div>
          {hasActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:text-[#1C2431]"
                  aria-label={`Acciones para la tarea ${task.title}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                {onMoveTaskStatus ? (
                  <>
                    <DropdownMenuItem onSelect={() => onMoveTaskStatus("todo")}>
                      Mover a: Por hacer
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onMoveTaskStatus("in_progress")}>
                      Mover a: En progreso
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onMoveTaskStatus("done")}>
                      Mover a: Completado
                    </DropdownMenuItem>
                    <div className="my-1 h-px bg-neutral-200" />
                  </>
                ) : null}
                {onViewTask ? (
                  <DropdownMenuItem onSelect={() => onViewTask()}>Ver detalles</DropdownMenuItem>
                ) : null}
                {onEditTask ? (
                  <DropdownMenuItem onSelect={() => onEditTask()}>Editar tarea</DropdownMenuItem>
                ) : null}
                {onDeleteTask ? (
                  <DropdownMenuItem className="text-destructive" onSelect={() => onDeleteTask()}>
                    Eliminar tarea
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              statusDisplay.badgeClass,
            )}
          >
            {TASK_STATUS_LABELS[task.status]}
          </span>
          {priority ? (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                PRIORITY_BADGE_STYLES[priority],
              )}
            >
              {TASK_PRIORITY_LABELS[priority]}
            </span>
          ) : (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                PRIORITY_FALLBACK_CLASS,
              )}
            >
              Sin prioridad
            </span>
          )}
          <span
            className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium", projectBadgeClass)}
          >
            {resolvedProjectName}
          </span>
        </div>

        <p className="line-clamp-2 text-[13px] text-neutral-600">{description}</p>

        <div className="flex flex-col gap-1.5 border-t border-black/5 pt-2 text-xs text-neutral-600">
          <div className="flex flex-wrap items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
            <span className="font-medium text-neutral-700">Vence:</span>
            <span className={cn("font-medium", dueDateInfo.toneClass)}>{dueDateInfo.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
            <span className="font-medium text-neutral-700">Actualizada:</span>
            <span>{formatTaskDateTime(task.updatedAt)}</span>
          </div>
        </div>
      </article>
    );
  },
);

TaskCardLayout.displayName = "TaskCardLayout";

const TaskCard = ({
  task,
  isActive,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onMoveTaskStatus,
  projectName,
  showDragHandle,
}: TaskCardProps) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
    userSelect: "none",
    willChange: "transform",
  };

  return (
    <TaskCardLayout
      ref={setNodeRef}
      task={task}
      isActive={isActive}
      isDragging={isDragging}
      className="active:scale-95"
      style={style}
      data-status={task.status}
      onViewTask={onViewTask ? () => onViewTask(task) : undefined}
      onEditTask={onEditTask ? () => onEditTask(task) : undefined}
      onDeleteTask={onDeleteTask ? () => onDeleteTask(task) : undefined}
      onMoveTaskStatus={
        onMoveTaskStatus ? (newStatus) => onMoveTaskStatus(task, newStatus) : undefined
      }
      projectName={projectName ?? null}
      showDragHandle={showDragHandle}
      {...attributes}
      {...listeners}
      aria-label={`Tarea: ${task.title}`}
    />
  );
};

const TaskCardPreview = ({ task, projectName }: { task: Task; projectName?: string | null }) => (
  <TaskCardLayout
    task={task}
    className="pointer-events-none scale-105 shadow-[0_20px_60px_rgba(0,0,0,0.3)] select-none"
    showActions={false}
    isActive
    projectName={projectName ?? null}
  />
);

/**
 * Displays tasks in a three-column Kanban layout with drag-and-drop and keyboard interactions.
 */
const KanbanBoard = ({
  tasks,
  onTaskStatusChange,
  isUpdating = false,
  onViewTask,
  onEditTask,
  onDeleteTask,
  projectNames,
}: KanbanBoardProps) => {
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { distance: 15, delay: 250 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 12 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const buckets = useMemo<TaskBuckets>(() => {
    const initial: TaskBuckets = {
      todo: [],
      in_progress: [],
      done: [],
    };

    tasks.forEach((task) => {
      initial[task.status].push(task);
    });

    return initial;
  }, [tasks]);

  const taskLookup = useMemo(() => {
    const lookup = new Map<number, Task>();
    tasks.forEach((task) => {
      lookup.set(task.id, task);
    });
    return lookup;
  }, [tasks]);

  const activeTask = useMemo(
    () => (activeId ? (taskLookup.get(activeId) ?? null) : null),
    [activeId, taskLookup],
  );

  // Prepare alternative mobile render; we will choose at return time to preserve hook order.
  const mobileContent = (() => {
    const counts = {
      todo: buckets.todo.length,
      in_progress: buckets.in_progress.length,
      done: buckets.done.length,
    };

    const renderList = (list: Task[]) =>
      list.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
          <p className="text-muted-foreground flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-[rgba(28,36,49,0.15)] px-3 text-center text-[13px]">
            No hay tareas en esta columna
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isActive={false}
              showDragHandle={false}
              onViewTask={onViewTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onMoveTaskStatus={(t: Task, newStatus: TaskStatus) => {
                if (t.status !== newStatus) onTaskStatusChange(t.id, newStatus);
              }}
              projectName={
                task.projectId !== null ? (projectNames?.get(task.projectId) ?? null) : null
              }
            />
          ))}
        </div>
      );

    return (
      <Tabs defaultValue="todo">
        <TabsList className="grid w-full grid-cols-3 rounded-md bg-neutral-50 p-0.5">
          <TabsTrigger
            className="h-8 truncate rounded-md px-2 text-[12px] leading-4 whitespace-nowrap data-[state=active]:bg-yellow-200 data-[state=active]:text-[#1C2431]"
            value="todo"
          >
            Por hacer ({counts.todo})
          </TabsTrigger>
          <TabsTrigger
            className="h-8 truncate rounded-md px-2 text-[12px] leading-4 whitespace-nowrap data-[state=active]:bg-yellow-200 data-[state=active]:text-[#1C2431]"
            value="in_progress"
          >
            En progreso ({counts.in_progress})
          </TabsTrigger>
          <TabsTrigger
            className="h-8 truncate rounded-md px-2 text-[12px] leading-4 whitespace-nowrap data-[state=active]:bg-yellow-200 data-[state=active]:text-[#1C2431]"
            value="done"
          >
            Completado ({counts.done})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="todo" className="mt-4">
          {renderList(buckets.todo)}
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          {renderList(buckets.in_progress)}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {renderList(buckets.done)}
        </TabsContent>
      </Tabs>
    );
  })();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const sourceId = Number(event.active.id);

    if (Number.isInteger(sourceId) && sourceId > 0) {
      setActiveId(sourceId);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) {
        return;
      }

      const taskId = Number(active.id);

      if (!Number.isInteger(taskId) || taskId <= 0) {
        return;
      }

      const dataStatus = resolveTaskStatus(
        (over.data?.current as { status?: unknown } | undefined)?.status ?? null,
      );
      const idStatus = resolveTaskStatus(over.id);
      const nextStatus = dataStatus ?? idStatus;

      if (!nextStatus) {
        return;
      }

      const currentTask = taskLookup.get(taskId);

      if (!currentTask || currentTask.status === nextStatus) {
        return;
      }

      onTaskStatusChange(taskId, nextStatus);
    },
    [onTaskStatusChange, taskLookup],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const accessibility = useMemo(() => {
    const getTask = (id: unknown) => {
      const numericId = Number(id);

      if (!Number.isInteger(numericId) || numericId <= 0) {
        return undefined;
      }

      return taskLookup.get(numericId);
    };

    const describeColumn = (status: TaskStatus | null) => getStatusTitle(status) ?? undefined;

    const resolveFromOver = (
      over: DragOverEvent["over"] | DragEndEvent["over"],
    ): TaskStatus | null => {
      if (!over) {
        return null;
      }

      const dataStatus = resolveTaskStatus(
        (over.data?.current as { status?: unknown } | undefined)?.status ?? null,
      );

      return dataStatus ?? resolveTaskStatus(over.id);
    };

    return {
      screenReaderInstructions: {
        draggable:
          "Para tomar una tarea, presiona espacio o enter. Usa las flechas para moverte entre columnas y vuelve a presionar espacio o enter para soltar la tarea.",
      },
      announcements: {
        onDragStart: ({ active }: DragStartEvent) => {
          const task = getTask(active.id);

          if (!task) {
            return undefined;
          }

          const columnTitle = describeColumn(task.status);
          return columnTitle
            ? `Tomado ${task.title}. Columna actual ${columnTitle}.`
            : `Tomado ${task.title}.`;
        },
        onDragOver: ({ active, over }: DragOverEvent) => {
          if (!over) {
            return undefined;
          }

          const task = getTask(active.id);

          if (!task) {
            return undefined;
          }

          const status = resolveFromOver(over);
          const columnTitle = describeColumn(status);

          return columnTitle ? `${task.title} está sobre la columna ${columnTitle}.` : undefined;
        },
        onDragEnd: ({ active, over }: DragEndEvent) => {
          const task = getTask(active.id);

          if (!task) {
            return undefined;
          }

          if (!over) {
            return `${task.title} fue soltado fuera de cualquier columna.`;
          }

          const status = resolveFromOver(over);
          const columnTitle = describeColumn(status);

          return columnTitle
            ? `${task.title} fue soltado en la columna ${columnTitle}.`
            : `${task.title} fue soltado, pero la columna de destino es desconocida.`;
        },
        onDragCancel: ({ active }: DragCancelEvent) => {
          const task = getTask(active.id);
          return task ? `Arrastre cancelado ${task.title}.` : undefined;
        },
      },
    };
  }, [taskLookup]);

  return isMobile ? (
    mobileContent
  ) : (
    <DndContext
      accessibility={accessibility}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="-mx-2 overflow-x-auto overscroll-x-contain pb-1.5 md:mx-0">
        <div className="flex snap-x snap-mandatory gap-3 px-2 md:grid md:grid-cols-2 md:gap-5 md:px-0 xl:grid-cols-3">
          <div className="min-w-[280px] snap-start sm:min-w-[340px] md:min-w-0">
            <KanbanColumn
              title={STATUS_TITLES.todo}
              status="todo"
              tasks={buckets.todo}
              activeId={activeId}
              isUpdating={isUpdating}
              onViewTask={onViewTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              projectNames={projectNames}
            />
          </div>
          <div className="min-w-[280px] snap-start sm:min-w-[340px] md:min-w-0">
            <KanbanColumn
              title={STATUS_TITLES.in_progress}
              status="in_progress"
              tasks={buckets.in_progress}
              activeId={activeId}
              isUpdating={isUpdating}
              onViewTask={onViewTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              projectNames={projectNames}
            />
          </div>
          <div className="min-w-[280px] snap-start sm:min-w-[340px] md:min-w-0">
            <KanbanColumn
              title={STATUS_TITLES.done}
              status="done"
              tasks={buckets.done}
              activeId={activeId}
              isUpdating={isUpdating}
              onViewTask={onViewTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              projectNames={projectNames}
            />
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCardPreview
            task={activeTask}
            projectName={
              activeTask.projectId !== null
                ? (projectNames?.get(activeTask.projectId) ?? null)
                : null
            }
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
