import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Circle,
  GripVertical,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CardRenderProps } from "@/components/kanban-board";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/constants";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { cn, formatTaskDateTime } from "@/utils";

import { TASK_BOARD_STATUSES, TASK_BOARD_STATUS_TITLES } from "./task-schema";
import {
  getTaskDueDateInfo,
  TASK_PROJECT_BADGE_CLASS,
  TASK_PROJECT_BADGE_FALLBACK_CLASS,
  TASK_PROJECT_NAME_FALLBACK,
} from "./task-utils";

const BOARD_STATUS_DISPLAY: Record<
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

const BOARD_PRIORITY_BADGE_STYLES: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-neutral-200 text-neutral-700",
};

const BOARD_PRIORITY_FALLBACK_CLASS = "bg-neutral-100 text-neutral-600";

const isTaskPriority = (value: string | null): value is TaskPriority =>
  value === "low" || value === "medium" || value === "high";

type TaskBoardCardLayoutProps = {
  task: Task;
  projectName: string | null;
  isActive: boolean;
  isDragging: boolean;
  showDragHandle: boolean;
  containerProps: CardRenderProps<Task, TaskStatus>["containerProps"];
  dragHandleProps: CardRenderProps<Task, TaskStatus>["dragHandleProps"];
  onMoveStatus?: (newStatus: TaskStatus) => void;
  onEditTask?: () => void;
  onDeleteTask?: () => void;
  hideActions?: boolean;
};

type TaskBoardCardProps = CardRenderProps<Task, TaskStatus> & {
  projectName: string | null;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
};

export function TaskBoardCard({
  item,
  isActive,
  isDragging,
  showDragHandle,
  containerProps,
  dragHandleProps,
  onMoveStatus,
  projectName,
  onEditTask,
  onDeleteTask,
}: TaskBoardCardProps) {
  return (
    <TaskBoardCardLayout
      task={item}
      projectName={projectName}
      isActive={isActive}
      isDragging={isDragging}
      showDragHandle={showDragHandle}
      containerProps={containerProps}
      dragHandleProps={dragHandleProps}
      onMoveStatus={onMoveStatus}
      onEditTask={onEditTask ? () => onEditTask(item) : undefined}
      onDeleteTask={onDeleteTask ? () => onDeleteTask(item) : undefined}
    />
  );
}

function TaskBoardCardLayout({
  task,
  projectName,
  isActive,
  isDragging,
  showDragHandle,
  containerProps,
  dragHandleProps,
  onMoveStatus,
  onEditTask,
  onDeleteTask,
  hideActions = false,
}: TaskBoardCardLayoutProps) {
  const {
    ref: containerRef,
    style,
    className: containerClassName,
    ...restContainerProps
  } = containerProps;

  const statusDisplay = BOARD_STATUS_DISPLAY[task.status];
  const StatusIcon = statusDisplay.Icon;
  const priority = task.priority && isTaskPriority(task.priority) ? task.priority : null;
  const description = task.description?.trim().length
    ? task.description
    : "Sin descripción disponible.";
  const dueDateInfo = getTaskDueDateInfo(task.dueDate);
  const hasProject = task.projectId !== null;
  const resolvedProjectName = hasProject
    ? (projectName ?? TASK_PROJECT_NAME_FALLBACK)
    : "Sin proyecto";
  const projectBadgeClass = hasProject
    ? TASK_PROJECT_BADGE_CLASS
    : TASK_PROJECT_BADGE_FALLBACK_CLASS;
  const hasActions = !hideActions && (onMoveStatus || onEditTask || onDeleteTask);

  return (
    <article
      ref={containerRef}
      style={style}
      {...restContainerProps}
      className={cn(
        "group relative flex max-w-full flex-col gap-2 rounded-xl border border-black/5 bg-white p-4 text-neutral-900 shadow-sm transition-transform duration-150 ease-out will-change-transform select-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#F6C90E] focus-visible:ring-offset-2 focus-visible:outline-none sm:max-w-[360px] md:p-5",
        isActive ? "ring-2 ring-[#F6C90E] ring-offset-2" : "",
        isDragging ? "z-10 scale-[1.02] shadow-lg" : "",
        containerClassName,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {showDragHandle ? (
            <button
              type="button"
              aria-label="Arrastrar tarea"
              className="flex h-6 w-6 items-center justify-center rounded-xl"
              {...dragHandleProps}
            >
              <span className="sr-only">Arrastrar tarea</span>
              <GripVertical className="h-5 w-5 text-neutral-400" aria-hidden="true" />
            </button>
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
            <span className="line-clamp-1 text-base font-semibold md:text-lg">{task.title}</span>
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
              {onMoveStatus ? (
                <>
                  {TASK_BOARD_STATUSES.map((status) => (
                    <DropdownMenuItem key={status} onSelect={() => onMoveStatus(status)}>
                      {`Mover a: ${TASK_BOARD_STATUS_TITLES[status]}`}
                    </DropdownMenuItem>
                  ))}
                  <div className="my-1 h-px bg-neutral-200" />
                </>
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
              BOARD_PRIORITY_BADGE_STYLES[priority],
            )}
          >
            {TASK_PRIORITY_LABELS[priority]}
          </span>
        ) : (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              BOARD_PRIORITY_FALLBACK_CLASS,
            )}
          >
            Sin prioridad
          </span>
        )}
        <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium", projectBadgeClass)}>
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
}

export function TaskBoardCardPreview({
  task,
  projectName,
}: {
  task: Task;
  projectName: string | null;
}) {
  const inertRef = () => {};
  const previewContainerProps = {
    ref: inertRef,
    style: undefined,
    className: "pointer-events-none scale-105 shadow-[0_20px_60px_rgba(0,0,0,0.3)] select-none",
    "data-status": task.status,
  } as CardRenderProps<Task, TaskStatus>["containerProps"];

  return (
    <TaskBoardCardLayout
      task={task}
      projectName={projectName}
      isActive
      isDragging={false}
      showDragHandle={false}
      containerProps={previewContainerProps}
      dragHandleProps={{}}
      hideActions
    />
  );
}
