import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
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
import { PROJECT_PRIORITY_LABELS, PROJECT_STATUS_LABELS } from "@/constants";
import type { ProjectPriority, ProjectStatus, ProjectWithTaskCount } from "@/types";
import { cn, formatTaskDateTime } from "@/utils";

const PROJECT_STATUS_DISPLAY: Record<
  ProjectStatus,
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

const PROJECT_PRIORITY_BADGE_STYLES: Record<ProjectPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-neutral-200 text-neutral-700",
};

const PROJECT_TASK_BADGE_CLASS = "bg-blue-100 text-blue-700";

type ProjectBoardCardLayoutProps = {
  project: ProjectWithTaskCount;
  isActive: boolean;
  isDragging: boolean;
  showDragHandle: boolean;
  containerProps: CardRenderProps<ProjectWithTaskCount, ProjectStatus>["containerProps"];
  dragHandleProps: CardRenderProps<ProjectWithTaskCount, ProjectStatus>["dragHandleProps"];
  onMoveProjectStatus?: (newStatus: ProjectStatus) => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  hideActions?: boolean;
};

type ProjectBoardCardProps = CardRenderProps<ProjectWithTaskCount, ProjectStatus> & {
  onView?: (project: ProjectWithTaskCount) => void;
  onEdit?: (project: ProjectWithTaskCount) => void;
  onDelete?: (project: ProjectWithTaskCount) => void;
};

export function ProjectBoardCard({
  item,
  isActive,
  isDragging,
  showDragHandle,
  containerProps,
  dragHandleProps,
  onMoveStatus,
  onView,
  onEdit,
  onDelete,
}: ProjectBoardCardProps) {
  return (
    <ProjectBoardCardLayout
      project={item}
      isActive={isActive}
      isDragging={isDragging}
      showDragHandle={showDragHandle}
      containerProps={containerProps}
      dragHandleProps={dragHandleProps}
      onMoveProjectStatus={onMoveStatus}
      onView={onView ? () => onView(item) : undefined}
      onEdit={onEdit ? () => onEdit(item) : undefined}
      onDelete={onDelete ? () => onDelete(item) : undefined}
    />
  );
}

function ProjectBoardCardLayout({
  project,
  isActive,
  isDragging,
  showDragHandle,
  containerProps,
  dragHandleProps,
  onMoveProjectStatus,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  hideActions = false,
}: ProjectBoardCardLayoutProps) {
  const {
    ref: containerRef,
    style,
    className: containerClassName,
    ...restContainerProps
  } = containerProps;

  const statusDisplay = PROJECT_STATUS_DISPLAY[project.status];
  const StatusIcon = statusDisplay.Icon;
  const description = project.description?.trim().length
    ? project.description
    : "Sin descripción disponible.";
  const allowActions = Boolean(showActions) && !hideActions;

  return (
    <article
      ref={containerRef}
      style={style}
      {...restContainerProps}
      className={cn(
        "group relative flex max-w-full flex-col gap-2 rounded-xl border border-black/5 bg-white p-4 text-neutral-900 shadow-sm transition-transform duration-200 ease-out will-change-transform select-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#F6C90E] focus-visible:ring-offset-2 focus-visible:outline-none sm:max-w-[360px] md:p-5",
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
              aria-label="Arrastrar proyecto"
              className="flex h-6 w-6 items-center justify-center rounded-xl"
              {...dragHandleProps}
            >
              <span className="sr-only">Arrastrar proyecto</span>
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
            {onView ? (
              <button
                type="button"
                onClick={onView}
                className="text-left text-base font-semibold transition-colors hover:text-[#E8B90D] md:text-lg"
              >
                <span className="line-clamp-1">{project.name}</span>
              </button>
            ) : (
              <span className="line-clamp-1 text-base font-semibold md:text-lg">
                {project.name}
              </span>
            )}
          </div>
        </div>
        {allowActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-[#1C2431]"
                aria-label={`Acciones para el proyecto ${project.name}`}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              {onMoveProjectStatus ? (
                <>
                  <DropdownMenuItem onSelect={() => onMoveProjectStatus("todo")}>
                    Mover a: Por hacer
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onMoveProjectStatus("in_progress")}>
                    Mover a: En progreso
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onMoveProjectStatus("done")}>
                    Mover a: Completado
                  </DropdownMenuItem>
                  <div className="my-1 h-px bg-neutral-200" />
                </>
              ) : null}
              {onView ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onView();
                  }}
                >
                  Ver detalles
                </DropdownMenuItem>
              ) : null}
              {onEdit ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onEdit();
                  }}
                >
                  Editar proyecto
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    onDelete();
                  }}
                >
                  Eliminar proyecto
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
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            PROJECT_PRIORITY_BADGE_STYLES[project.priority],
          )}
        >
          {PROJECT_PRIORITY_LABELS[project.priority]}
        </span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            PROJECT_TASK_BADGE_CLASS,
          )}
        >
          {project.taskCount} tareas
        </span>
      </div>

      <p className="line-clamp-2 text-[13px] text-neutral-600">{description}</p>

      <div className="flex flex-col gap-1.5 border-t border-black/5 pt-2 text-xs text-neutral-600">
        <div className="flex flex-wrap items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <span className="font-medium text-neutral-700">Creado:</span>
          <span>{formatTaskDateTime(project.createdAt)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <span className="font-medium text-neutral-700">
            {project.completedTaskCount} tareas completadas
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProjectBoardCardPreview({ project }: { project: ProjectWithTaskCount }) {
  const inertRef = () => {};
  const previewContainerProps = {
    ref: inertRef,
    style: undefined,
    className: "pointer-events-none scale-105 shadow-[0_20px_60px_rgba(0,0,0,0.3)] select-none",
    "data-status": project.status,
  } as CardRenderProps<ProjectWithTaskCount, ProjectStatus>["containerProps"];

  return (
    <ProjectBoardCardLayout
      project={project}
      isActive
      isDragging={false}
      showDragHandle={false}
      containerProps={previewContainerProps}
      dragHandleProps={{}}
      showActions={false}
      hideActions
    />
  );
}
