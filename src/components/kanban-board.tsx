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

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
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
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
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
}

type KanbanColumnProps = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  activeId: number | null;
  isUpdating?: boolean;
};

type TaskCardProps = {
  task: Task;
  isActive: boolean;
};

type TaskCardLayoutProps = HTMLAttributes<HTMLDivElement> & {
  task: Task;
};

const KanbanColumn = ({ title, status, tasks, activeId, isUpdating }: KanbanColumnProps) => {
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
          aria-label={`${title} column`}
          aria-busy={Boolean(isUpdating)}
          role="list"
        >
          {tasks.length === 0 ? (
            <p className="text-muted-foreground rounded border border-dashed border-[rgba(28,36,49,0.15)] p-4 text-center text-sm">
              No tasks in this column
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} isActive={activeId === task.id} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const TaskCardLayout = forwardRef<HTMLDivElement, TaskCardLayoutProps>(
  ({ task, className, ...rest }, ref) => {
    const priority = task.priority;

    return (
      <Card
        ref={ref}
        className={cn(
          "text-foreground border border-[rgba(0,0,0,0.05)] bg-white shadow-sm",
          className,
        )}
        {...rest}
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-lg leading-tight font-semibold">
            <span className="line-clamp-2">{task.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm">
          <p className="line-clamp-2 text-left">
            {task.description ? task.description : "No description provided."}
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
          <p className="text-muted-foreground text-xs">Due {formatTaskDate(task.dueDate)}</p>
        </CardContent>
      </Card>
    );
  },
);

TaskCardLayout.displayName = "TaskCardLayout";

const TaskCard = ({ task, isActive }: TaskCardProps) => {
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
      {...attributes}
      {...listeners}
      aria-label={`Task: ${task.title}`}
    />
  );
};

const TaskCardPreview = ({ task }: { task: Task }) => (
  <TaskCardLayout
    task={task}
    className="pointer-events-none shadow-2xl ring-2 ring-[#F6C90E] select-none"
  />
);

/**
 * Displays tasks in a three-column Kanban layout with drag-and-drop and keyboard interactions.
 */
const KanbanBoard = ({ tasks, onTaskStatusChange, isUpdating = false }: KanbanBoardProps) => {
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
          "To pick up a task, press space or enter. Use the arrow keys to move between columns, then press space or enter again to drop the task.",
      },
      announcements: {
        onDragStart: ({ active }: DragStartEvent) => {
          const task = getTask(active.id);

          if (!task) {
            return undefined;
          }

          const columnTitle = describeColumn(task.status);
          return columnTitle
            ? `Picked up ${task.title}. Current column ${columnTitle}.`
            : `Picked up ${task.title}.`;
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

          return columnTitle ? `${task.title} is over column ${columnTitle}.` : undefined;
        },
        onDragEnd: ({ active, over }: DragEndEvent) => {
          const task = getTask(active.id);

          if (!task) {
            return undefined;
          }

          if (!over) {
            return `${task.title} was dropped outside of any column.`;
          }

          const status = resolveFromOver(over);
          const columnTitle = describeColumn(status);

          return columnTitle
            ? `${task.title} was dropped in column ${columnTitle}.`
            : `${task.title} was dropped, but the destination column is unknown.`;
        },
        onDragCancel: ({ active }: DragCancelEvent) => {
          const task = getTask(active.id);
          return task ? `Cancelled dragging ${task.title}.` : undefined;
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
        />
        <KanbanColumn
          title={STATUS_TITLES.in_progress}
          status="in_progress"
          tasks={buckets.in_progress}
          activeId={activeId}
          isUpdating={isUpdating}
        />
        <KanbanColumn
          title={STATUS_TITLES.done}
          status="done"
          tasks={buckets.done}
          activeId={activeId}
          isUpdating={isUpdating}
        />
      </div>
      <DragOverlay>{activeTask ? <TaskCardPreview task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
