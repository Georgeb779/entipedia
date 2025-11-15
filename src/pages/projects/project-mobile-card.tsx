import { Badge, Button } from "@/components/ui";
import {
  PROJECT_PRIORITY_COLORS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
} from "@/constants";
import type { ProjectWithTaskCount } from "@/types";
import { cn, formatTaskDateTime } from "@/utils";
import TruncateText from "@/utils/truncate-text";

type ProjectMobileCardProps = {
  project: ProjectWithTaskCount;
  onView: (project: ProjectWithTaskCount) => void;
  onEdit: (project: ProjectWithTaskCount) => void;
  onDelete: (project: ProjectWithTaskCount) => void;
  isDeleting: boolean;
  className?: string;
};

export function ProjectMobileCard({
  project,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  className,
}: ProjectMobileCardProps) {
  const projectDescription = project.description
    ? project.description
    : "Sin descripción proporcionada.";
  const truncatedName = TruncateText(project.name, { maxLength: 60 });
  const truncatedDescription = TruncateText(projectDescription, { maxLength: 100 });

  return (
    <article
      className={cn(
        "space-y-4 rounded-lg border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm",
        className,
      )}
    >
      <header className="space-y-2">
        <h3
          className="max-w-60 overflow-hidden text-lg font-semibold text-ellipsis whitespace-nowrap text-[#1C2431] ..."
          title={project.name}
        >
          {truncatedName}
        </h3>
        <p
          className="text-muted-foreground max-w-md overflow-hidden text-sm text-ellipsis whitespace-nowrap ..."
          title={projectDescription}
        >
          {truncatedDescription}
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn("uppercase", PROJECT_STATUS_COLORS[project.status])}>
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
        <Badge className={cn("uppercase", PROJECT_PRIORITY_COLORS[project.priority])}>
          {PROJECT_PRIORITY_LABELS[project.priority]}
        </Badge>
        <Badge className="bg-[rgba(28,36,49,0.08)] text-[#1C2431]">
          {project.taskCount} tareas
        </Badge>
      </div>
      <dl className="text-muted-foreground grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <dt className="text-foreground text-xs font-medium tracking-wide uppercase">Creado</dt>
          <dd>{formatTaskDateTime(project.createdAt)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-foreground text-xs font-medium tracking-wide uppercase">
            Tareas completadas
          </dt>
          <dd>{project.completedTaskCount}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={() => onView(project)}
        >
          Ver detalles
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={() => onEdit(project)}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="w-full justify-center"
          onClick={() => onDelete(project)}
          disabled={isDeleting}
        >
          {isDeleting ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>
    </article>
  );
}
