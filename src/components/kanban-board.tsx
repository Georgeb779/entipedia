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
  type DraggableSyntheticListeners,
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
} from "@/components/ui";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/constants";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { cn, formatTaskDate, resolveStatusValue } from "@/utils";

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
};

type TaskCardProps = {
  task: Task;
  isActive: boolean;
  onViewTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
};

type TaskCardLayoutProps = HTMLAttributes<HTMLDivElement> & {
  task: Task;
  onViewTask?: () => void;
  onEditTask?: () => void;
  onDeleteTask?: () => void;
  showActions?: boolean;
  isActive?: boolean;
  isDragging?: boolean;
  dragHandleListeners?: DraggableSyntheticListeners;
  dragHandleRef?: (element: HTMLElement | null) => void;
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
}: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: status, data: { status } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">{title}</h2>
        <span className="inline-flex h-8 min-w-10 items-center justify-center rounded-full bg-neutral-100 px-3 text-xs font-semibold text-neutral-700">
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
            "flex min-h-[500px] flex-col gap-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[#f8f7f3] p-5 shadow-sm transition-all duration-200 md:min-h-[400px] md:p-4",
            isOver ? "drop-zone-active animate-pulse-ring" : "drop-zone-idle",
            isUpdating ? "opacity-80" : "",
          )}
          aria-label={`Columna ${title}`}
          aria-busy={Boolean(isUpdating)}
          role="list"
        >
          {tasks.length === 0 ? (
            <p className="text-muted-foreground rounded border border-dashed border-[rgba(28,36,49,0.15)] p-4 text-center text-sm">
              No hay tareas en esta columna
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={activeId === task.id}
                onViewTask={onViewTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
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
      showActions = true,
      isActive = false,
      isDragging = false,
      dragHandleListeners,
      dragHandleRef,
      ...rest
    },
    ref,
  ) => {
    const hasActions = showActions && (onViewTask || onEditTask || onDeleteTask);
    const statusDisplay = STATUS_DISPLAY[task.status];
    const StatusIcon = statusDisplay.Icon;
    const priority = task.priority && isTaskPriority(task.priority) ? task.priority : null;
    const dueDateInfo = getDueDateInfo(task.dueDate);

    return (
      <article
        ref={ref}
        className={cn(
          "group relative flex max-w-[360px] flex-col gap-3 rounded-xl border border-black/5 bg-white p-5 text-neutral-900 shadow-sm transition-transform duration-150 ease-out will-change-transform select-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#F6C90E] focus-visible:ring-offset-2 focus-visible:outline-none md:p-6",
          isActive ? "ring-2 ring-[#F6C90E] ring-offset-2" : "",
          isDragging ? "scale-[0.99]" : "",
          className,
        )}
        {...rest}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            {showActions ? (
              <div
                aria-label="Arrastrar tarea"
                className="touch-action-none flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100"
                ref={dragHandleRef ?? undefined}
                {...(dragHandleListeners ?? {})}
              >
                <span className="sr-only">Arrastrar tarea</span>
                <GripVertical className="h-5 w-5 text-neutral-400" aria-hidden="true" />
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    statusDisplay.iconWrapperClass,
                  )}
                >
                  <StatusIcon
                    className={cn("h-4 w-4", statusDisplay.iconClass)}
                    aria-hidden="true"
                  />
                </span>
                {onViewTask ? (
                  <button
                    type="button"
                    onClick={onViewTask}
                    className="text-left text-lg font-semibold transition-colors hover:text-[#E8B90D]"
                  >
                    <span className="line-clamp-1">{task.title}</span>
                  </button>
                ) : (
                  <span className="line-clamp-1 text-lg font-semibold">{task.title}</span>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-neutral-600">
                {task.description?.trim().length ? task.description : "Sin descripción disponible."}
              </p>
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

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn("rounded-md px-2 py-0.5 text-xs font-medium", statusDisplay.badgeClass)}
          >
            {TASK_STATUS_LABELS[task.status]}
          </span>
          {priority ? (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                PRIORITY_BADGE_STYLES[priority],
              )}
            >
              {TASK_PRIORITY_LABELS[priority]}
            </span>
          ) : (
            <span
              className={cn("rounded-md px-2 py-0.5 text-xs font-medium", PRIORITY_FALLBACK_CLASS)}
            >
              Sin prioridad
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-black/5 pt-3">
          <CalendarDays className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          <span className={cn("text-xs font-medium", dueDateInfo.toneClass)}>
            Fecha de Vencimiento: {dueDateInfo.label}
          </span>
        </div>
      </article>
    );
  },
);

TaskCardLayout.displayName = "TaskCardLayout";

const TaskCard = ({ task, isActive, onViewTask, onEditTask, onDeleteTask }: TaskCardProps) => {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: "none",
    willChange: "transform",
  };

  return (
    <TaskCardLayout
      ref={setNodeRef}
      task={task}
      isActive={isActive}
      isDragging={isDragging}
      dragHandleRef={setActivatorNodeRef}
      dragHandleListeners={listeners}
      className="active:scale-95"
      style={style}
      data-status={task.status}
      onViewTask={onViewTask ? () => onViewTask(task) : undefined}
      onEditTask={onEditTask ? () => onEditTask(task) : undefined}
      onDeleteTask={onDeleteTask ? () => onDeleteTask(task) : undefined}
      {...attributes}
      aria-label={`Tarea: ${task.title}`}
    />
  );
};

const TaskCardPreview = ({ task }: { task: Task }) => (
  <TaskCardLayout
    task={task}
    className="pointer-events-none scale-105 shadow-[0_20px_60px_rgba(0,0,0,0.3)] select-none"
    showActions={false}
    isActive
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
}: KanbanBoardProps) => {
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

  return (
    <DndContext
      accessibility={accessibility}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KanbanColumn
          title={STATUS_TITLES.todo}
          status="todo"
          tasks={buckets.todo}
          activeId={activeId}
          isUpdating={isUpdating}
          onViewTask={onViewTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
        <KanbanColumn
          title={STATUS_TITLES.in_progress}
          status="in_progress"
          tasks={buckets.in_progress}
          activeId={activeId}
          isUpdating={isUpdating}
          onViewTask={onViewTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
        <KanbanColumn
          title={STATUS_TITLES.done}
          status="done"
          tasks={buckets.done}
          activeId={activeId}
          isUpdating={isUpdating}
          onViewTask={onViewTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      </div>
      <DragOverlay>{activeTask ? <TaskCardPreview task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
