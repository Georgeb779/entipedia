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

import { MoreHorizontal } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from "@/constants";
import type { Task, TaskStatus } from "@/types";
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge className="bg-[rgba(28,36,49,0.08)] text-[#1C2431]">{tasks.length}</Badge>
      </div>
      <SortableContext
        id={status}
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[400px] flex-col gap-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[#f8f7f3] p-4 shadow-sm transition-colors",
            isOver ? "ring-2 ring-[#F6C90E]" : "ring-1 ring-transparent",
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
  ({ task, className, onViewTask, onEditTask, onDeleteTask, showActions = true, ...rest }, ref) => {
    const priority = task.priority;
    const hasActions = showActions && (onViewTask || onEditTask || onDeleteTask);

    return (
      <Card
        ref={ref}
        className={cn(
          "text-foreground border border-[rgba(0,0,0,0.05)] bg-white shadow-sm",
          className,
        )}
        {...rest}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
          <CardTitle className="text-lg leading-tight font-semibold">
            <span className="line-clamp-2">{task.title}</span>
          </CardTitle>
          {hasActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-[#1C2431]"
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
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm">
          <p className="line-clamp-2 text-left">
            {task.description ? task.description : "Sin descripción proporcionada."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("uppercase", TASK_STATUS_COLORS[task.status])}>
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
            {priority === "low" || priority === "medium" || priority === "high" ? (
              <Badge className={cn("uppercase", TASK_PRIORITY_COLORS[priority])}>
                {TASK_PRIORITY_LABELS[priority]}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            Fecha de Vencimiento: {formatTaskDate(task.dueDate)}
          </p>
        </CardContent>
      </Card>
    );
  },
);

TaskCardLayout.displayName = "TaskCardLayout";

const TaskCard = ({ task, isActive, onViewTask, onEditTask, onDeleteTask }: TaskCardProps) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <TaskCardLayout
      ref={setNodeRef}
      task={task}
      className={cn(
        "transition-all select-none focus-visible:ring-2 focus-visible:ring-[#F6C90E] focus-visible:outline-none",
        "hover:scale-[1.02] hover:shadow-lg",
        isActive ? "ring-2 ring-[#F6C90E]" : "border border-transparent",
      )}
      style={style}
      data-status={task.status}
      onViewTask={onViewTask ? () => onViewTask(task) : undefined}
      onEditTask={onEditTask ? () => onEditTask(task) : undefined}
      onDeleteTask={onDeleteTask ? () => onDeleteTask(task) : undefined}
      {...attributes}
      {...listeners}
      aria-label={`Tarea: ${task.title}`}
    />
  );
};

const TaskCardPreview = ({ task }: { task: Task }) => (
  <TaskCardLayout
    task={task}
    className="pointer-events-none shadow-2xl ring-2 ring-[#F6C90E] select-none"
    showActions={false}
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
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
