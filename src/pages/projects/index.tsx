import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragCancelEvent,
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

import { Button, Layout, ProtectedRoute } from "@/components";
import {
  Badge,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Textarea,
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
  PROJECT_PRIORITY_COLORS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_OPTIONS,
} from "@/constants";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks";
import type { ProjectPriority, ProjectStatus, ProjectWithTaskCount } from "@/types";
import { cn, formatTaskDateTime, resolveStatusValue } from "@/utils";

const projectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre del proyecto es requerido.")
      .max(255, "El nombre del proyecto debe tener 255 caracteres o menos."),
    description: z
      .string()
      .trim()
      .max(2000, "La descripción debe tener 2000 caracteres o menos.")
      .optional()
      .nullable(),
    status: z.enum(["todo", "in_progress", "done"]).default("todo"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  })
  .transform((values) => ({
    name: values.name.trim(),
    description: values.description ? values.description.trim() : null,
    status: values.status,
    priority: values.priority,
  }));

type ProjectSchema = z.infer<typeof projectSchema>;

const defaultFormValues: ProjectSchema = {
  name: "",
  description: null,
  status: "todo",
  priority: "medium",
};

const STATUSES: readonly ProjectStatus[] = ["todo", "in_progress", "done"];

const STATUS_TITLES: Record<ProjectStatus, string> = {
  todo: "Por Hacer",
  in_progress: "En Progreso",
  done: "Completado",
};

const mapProjectToFormValues = (project: ProjectWithTaskCount): ProjectSchema => ({
  name: project.name,
  description: project.description ?? null,
  status: project.status,
  priority: project.priority,
});

type ProjectBuckets = Record<ProjectStatus, ProjectWithTaskCount[]>;

type ProjectViewMode = "board" | "table";

const resolveProjectViewMode = (value: string | null | undefined): ProjectViewMode =>
  value === "table" ? "table" : "board";

type KanbanColumnProps = {
  title: string;
  status: ProjectStatus;
  projects: ProjectWithTaskCount[];
  activeId: number | null;
  isUpdating?: boolean;
  onView: (project: ProjectWithTaskCount) => void;
  onEdit: (project: ProjectWithTaskCount) => void;
  onDelete: (project: ProjectWithTaskCount) => void;
};

type ProjectCardProps = {
  project: ProjectWithTaskCount;
  isActive: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

type ProjectCardLayoutProps = HTMLAttributes<HTMLDivElement> & {
  project: ProjectWithTaskCount;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isActive?: boolean;
  isDragging?: boolean;
};

const resolveProjectStatus = (value: unknown): ProjectStatus | null =>
  resolveStatusValue<ProjectStatus>(value, STATUSES);

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

const KanbanColumn = ({
  title,
  status,
  projects,
  activeId,
  isUpdating,
  onView,
  onEdit,
  onDelete,
}: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: status, data: { status } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">{title}</h2>
        <span className="inline-flex h-8 min-w-10 items-center justify-center rounded-full bg-neutral-100 px-3 text-xs font-semibold text-neutral-700">
          {projects.length}
        </span>
      </div>
      <SortableContext
        id={status}
        items={projects.map((project) => project.id)}
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
          {projects.length === 0 ? (
            <p className="text-muted-foreground rounded border border-dashed border-[rgba(28,36,49,0.15)] p-4 text-center text-sm">
              No hay proyectos en esta columna
            </p>
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={activeId === project.id}
                onView={() => onView(project)}
                onEdit={() => onEdit(project)}
                onDelete={() => onDelete(project)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const ProjectCardLayout = forwardRef<HTMLDivElement, ProjectCardLayoutProps>(
  (
    {
      project,
      className,
      onView,
      onEdit,
      onDelete,
      showActions = true,
      isActive = false,
      isDragging = false,
      ...rest
    },
    ref,
  ) => {
    const statusDisplay = PROJECT_STATUS_DISPLAY[project.status];
    const StatusIcon = statusDisplay.Icon;
    const description = project.description?.trim().length
      ? project.description
      : "Sin descripción disponible.";

    return (
      <article
        ref={ref}
        className={cn(
          "group touch-action-none relative flex max-w-[360px] flex-col gap-3 rounded-xl border border-black/5 bg-white p-5 text-neutral-900 shadow-sm transition-transform duration-200 ease-out will-change-transform select-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#F6C90E] focus-visible:ring-offset-2 focus-visible:outline-none md:p-6",
          isActive ? "ring-2 ring-[#F6C90E] ring-offset-2" : "",
          isDragging ? "scale-[0.99]" : "",
          className,
        )}
        {...rest}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {showActions ? (
              <div
                aria-label="Arrastrar proyecto"
                className="flex h-6 w-6 items-center justify-center rounded-xl"
              >
                <span className="sr-only">Arrastrar proyecto</span>
                <GripVertical className="h-5 w-5 text-neutral-400" aria-hidden="true" />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  statusDisplay.iconWrapperClass,
                )}
              >
                <StatusIcon className={cn("h-4 w-4", statusDisplay.iconClass)} aria-hidden="true" />
              </span>
              {onView ? (
                <button
                  type="button"
                  onClick={onView}
                  className="text-left text-lg font-semibold transition-colors hover:text-[#E8B90D]"
                >
                  <span className="line-clamp-1">{project.name}</span>
                </button>
              ) : (
                <span className="line-clamp-1 text-lg font-semibold">{project.name}</span>
              )}
            </div>
          </div>
          {showActions ? (
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

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn("rounded-md px-2 py-0.5 text-xs font-medium", statusDisplay.badgeClass)}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              PROJECT_PRIORITY_BADGE_STYLES[project.priority],
            )}
          >
            {PROJECT_PRIORITY_LABELS[project.priority]}
          </span>
          <span
            className={cn("rounded-md px-2 py-0.5 text-xs font-medium", PROJECT_TASK_BADGE_CLASS)}
          >
            {project.taskCount} tareas
          </span>
        </div>

        <p className="line-clamp-3 text-sm text-neutral-600">{description}</p>

        <div className="flex flex-col gap-2 border-t border-black/5 pt-3 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            <span className="font-medium text-neutral-700">Creado:</span>
            <span>{formatTaskDateTime(project.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            <span className="font-medium text-neutral-700">
              {project.completedTaskCount} tareas completadas
            </span>
          </div>
        </div>
      </article>
    );
  },
);

ProjectCardLayout.displayName = "ProjectCardLayout";

const ProjectCard = ({ project, isActive, onView, onEdit, onDelete }: ProjectCardProps) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: project.id,
    data: { status: project.status },
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
    <ProjectCardLayout
      ref={setNodeRef}
      project={project}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      isActive={isActive}
      isDragging={isDragging}
      style={style}
      data-status={project.status}
      {...attributes}
      {...listeners}
      aria-label={`Proyecto: ${project.name}`}
    />
  );
};

const ProjectCardPreview = ({ project }: { project: ProjectWithTaskCount }) => (
  <ProjectCardLayout
    project={project}
    showActions={false}
    className="pointer-events-none scale-105 shadow-[0_20px_60px_rgba(0,0,0,0.3)] select-none"
    isActive
  />
);

type ProjectMobileCardProps = {
  project: ProjectWithTaskCount;
  onView: (project: ProjectWithTaskCount) => void;
  onEdit: (project: ProjectWithTaskCount) => void;
  onDelete: (project: ProjectWithTaskCount) => void;
  isDeleting: boolean;
  className?: string;
};

const ProjectMobileCard = ({
  project,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  className,
}: ProjectMobileCardProps) => (
  <article
    className={cn(
      "animate-card-fade-in space-y-4 rounded-lg border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm",
      className,
    )}
  >
    <header className="space-y-2">
      <h3 className="text-lg font-semibold text-[#1C2431]">{project.name}</h3>
      <p className="text-muted-foreground text-sm">
        {project.description ? project.description : "Sin descripción proporcionada."}
      </p>
    </header>
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={cn("uppercase", PROJECT_STATUS_COLORS[project.status])}>
        {PROJECT_STATUS_LABELS[project.status]}
      </Badge>
      <Badge className={cn("uppercase", PROJECT_PRIORITY_COLORS[project.priority])}>
        {PROJECT_PRIORITY_LABELS[project.priority]}
      </Badge>
      <Badge className="bg-[rgba(28,36,49,0.08)] text-[#1C2431]">{project.taskCount} tareas</Badge>
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

const ProjectsPage = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { editProjectId?: number } };
  const [searchParams, setSearchParams] = useSearchParams();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithTaskCount | null>(null);
  const [projectPendingDeletion, setProjectPendingDeletion] = useState<ProjectWithTaskCount | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const activeView = useMemo(
    () => resolveProjectViewMode(searchParams.get("view")),
    [searchParams],
  );

  const { data: projects = [], isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const createForm = useForm<ProjectSchema>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<ProjectSchema>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    const editProjectId = location.state?.editProjectId;

    if (!editProjectId) {
      return;
    }

    const projectToEdit = projects.find((project) => project.id === editProjectId);

    if (!projectToEdit) {
      return;
    }

    queueMicrotask(() => {
      setEditingProject(projectToEdit);
      setIsEditModalOpen(true);
      navigate("/projects", { replace: true, state: null });
    });
  }, [location.state, projects, navigate]);

  useEffect(() => {
    if (editingProject) {
      editForm.reset(mapProjectToFormValues(editingProject));
    }
  }, [editingProject, editForm]);

  const projectBuckets = useMemo<ProjectBuckets>(() => {
    const initial: ProjectBuckets = {
      todo: [],
      in_progress: [],
      done: [],
    };

    projects.forEach((project) => {
      initial[project.status].push(project);
    });

    return initial;
  }, [projects]);

  const projectLookup = useMemo(() => {
    const lookup = new Map<number, ProjectWithTaskCount>();
    projects.forEach((project) => {
      lookup.set(project.id, project);
    });
    return lookup;
  }, [projects]);

  const activeProject = useMemo(
    () => (activeId ? (projectLookup.get(activeId) ?? null) : null),
    [activeId, projectLookup],
  );

  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  const updateScrollIndicators = useCallback(() => {
    const container = tableScrollRef.current;

    if (!container) {
      setShowLeftIndicator(false);
      setShowRightIndicator(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;
    setShowLeftIndicator(scrollLeft > 0);
    setShowRightIndicator(scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    let animationFrame = window.requestAnimationFrame(() => {
      updateScrollIndicators();
    });

    const container = tableScrollRef.current;

    const handleScroll = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        updateScrollIndicators();
      });
    };

    const handleResize = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        updateScrollIndicators();
      });
    };

    container?.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      container?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [projects, updateScrollIndicators]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const resetCreateForm = useCallback(() => {
    createForm.reset(defaultFormValues);
    createForm.clearErrors();
  }, [createForm]);

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProject(null);
    editForm.clearErrors();
  };

  const handleCreateSubmit = async (values: ProjectSchema) => {
    createForm.clearErrors("root");

    try {
      await createProject.mutateAsync(values);
      closeCreateModal();
    } catch (mutationError) {
      createForm.setError("root", {
        type: "server",
        message:
          mutationError instanceof Error ? mutationError.message : "No se pudo crear el proyecto.",
      });
    }
  };

  const handleEditSubmit = async (values: ProjectSchema) => {
    if (!editingProject) {
      return;
    }

    editForm.clearErrors("root");

    try {
      await updateProject.mutateAsync({ projectId: editingProject.id, data: values });
      closeEditModal();
    } catch (mutationError) {
      editForm.setError("root", {
        type: "server",
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "No se pudo actualizar el proyecto.",
      });
    }
  };

  const openDeleteDialog = (project: ProjectWithTaskCount) => {
    setProjectPendingDeletion(project);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setProjectPendingDeletion(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!projectPendingDeletion) {
      return;
    }

    try {
      await deleteProject.mutateAsync(projectPendingDeletion.id);
      closeDeleteDialog();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "No se pudo eliminar el proyecto.";
      setDeleteError(message);
    }
  };

  const handleNavigateToDetails = (project: ProjectWithTaskCount) => {
    navigate(`/projects/${project.id}`);
  };

  const handleOpenEdit = (project: ProjectWithTaskCount) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  const handleViewChange = useCallback(
    (value: string) => {
      const nextView = resolveProjectViewMode(value);
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

  const sensorsUpdating = updateProject.isPending;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const sourceId = Number(event.active.id);

    if (Number.isInteger(sourceId) && sourceId > 0) {
      setActiveId(sourceId);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) {
        return;
      }

      const projectId = Number(active.id);

      if (!Number.isInteger(projectId) || projectId <= 0) {
        return;
      }

      const dataStatus = resolveProjectStatus(
        (over.data?.current as { status?: unknown } | undefined)?.status ?? null,
      );
      const idStatus = resolveProjectStatus(over.id);
      const nextStatus = dataStatus ?? idStatus;

      if (!nextStatus) {
        return;
      }

      const currentProject = projectLookup.get(projectId);

      if (!currentProject || currentProject.status === nextStatus) {
        return;
      }

      try {
        setBoardError(null);
        await updateProject.mutateAsync({ projectId, data: { status: nextStatus } });
      } catch (mutationError) {
        const message =
          mutationError instanceof Error
            ? mutationError.message
            : "No se pudo actualizar el proyecto.";
        setBoardError(message);
      }
    },
    [projectLookup, updateProject],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const accessibility = useMemo(() => {
    const getProject = (id: unknown) => {
      const numericId = Number(id);

      if (!Number.isInteger(numericId) || numericId <= 0) {
        return undefined;
      }

      return projectLookup.get(numericId);
    };

    const describeColumn = (status: ProjectStatus | null) =>
      status ? STATUS_TITLES[status] : undefined;

    const resolveFromOver = (over: DragOverEvent["over"] | DragEndEvent["over"]) => {
      if (!over) {
        return null;
      }

      const dataStatus = resolveProjectStatus(
        (over.data?.current as { status?: unknown } | undefined)?.status ?? null,
      );

      return dataStatus ?? resolveProjectStatus(over.id);
    };

    return {
      screenReaderInstructions: {
        draggable:
          "Para tomar un proyecto, presiona espacio o enter. Usa las flechas para moverte entre columnas y vuelve a presionar espacio o enter para soltarlo.",
      },
      announcements: {
        onDragStart: ({ active }: DragStartEvent) => {
          const project = getProject(active.id);

          if (!project) {
            return undefined;
          }

          const columnTitle = describeColumn(project.status);
          return columnTitle
            ? `Has tomado ${project.name}. Columna actual ${columnTitle}.`
            : `Has tomado ${project.name}.`;
        },
        onDragOver: ({ active, over }: DragOverEvent) => {
          if (!over) {
            return undefined;
          }

          const project = getProject(active.id);

          if (!project) {
            return undefined;
          }

          const status = resolveFromOver(over);
          const columnTitle = describeColumn(status);

          return columnTitle ? `${project.name} está sobre la columna ${columnTitle}.` : undefined;
        },
        onDragEnd: ({ active, over }: DragEndEvent) => {
          const project = getProject(active.id);

          if (!project) {
            return undefined;
          }

          if (!over) {
            return `${project.name} se soltó fuera de cualquier columna.`;
          }

          const status = resolveFromOver(over);
          const columnTitle = describeColumn(status);

          return columnTitle
            ? `${project.name} se colocó en la columna ${columnTitle}.`
            : `${project.name} se soltó, pero la columna de destino es desconocida.`;
        },
        onDragCancel: ({ active }: DragCancelEvent) => {
          const project = getProject(active.id);
          return project ? `Se canceló el movimiento de ${project.name}.` : undefined;
        },
      },
    };
  }, [projectLookup]);

  const renderProjectTableRows = () => {
    if (projects.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="py-10 text-center">
            <p className="text-muted-foreground text-sm">No se encontraron proyectos.</p>
          </TableCell>
        </TableRow>
      );
    }

    return projects.map((project) => (
      <TableRow key={project.id}>
        <TableCell className="text-foreground max-w-xs text-sm font-medium">
          {project.name}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {project.description ? project.description : "Sin descripción"}
        </TableCell>
        <TableCell>
          <Badge className={cn("uppercase", PROJECT_STATUS_COLORS[project.status])}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge className={cn("uppercase", PROJECT_PRIORITY_COLORS[project.priority])}>
            {PROJECT_PRIORITY_LABELS[project.priority]}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">{project.taskCount} tareas</TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {formatTaskDateTime(project.createdAt)}
        </TableCell>
        <TableCell className="text-right text-sm">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleNavigateToDetails(project)}>
              Ver
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(project)}>
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(project)}>
              Eliminar
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground px-5 py-10 md:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Tabs value={activeView} onValueChange={handleViewChange}>
              <header className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold">Proyectos</h1>
                  <p className="text-muted-foreground text-sm">
                    Organiza tu trabajo en proyectos, sigue el avance de las tareas y mantente al
                    día con tus entregas.
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
                    variant="secondary"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto lg:w-auto"
                  >
                    Crear proyecto
                  </Button>
                </div>
              </header>

              <TabsContent value="board" className="mt-0 border-0 bg-transparent p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" label="Cargando proyectos..." />
                  </div>
                ) : error ? (
                  <div className="text-destructive py-12 text-center">
                    {error instanceof Error
                      ? error.message
                      : "No se pudieron cargar los proyectos."}
                  </div>
                ) : (
                  <section className="rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-5 shadow-sm md:p-6">
                    {boardError ? (
                      <div className="text-destructive mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
                        {boardError}
                      </div>
                    ) : null}
                    <DndContext
                      accessibility={accessibility}
                      sensors={sensors}
                      collisionDetection={closestCorners}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragCancel={handleDragCancel}
                    >
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {STATUSES.map((status) => (
                          <KanbanColumn
                            key={status}
                            title={STATUS_TITLES[status]}
                            status={status}
                            projects={projectBuckets[status]}
                            activeId={activeId}
                            isUpdating={sensorsUpdating}
                            onView={handleNavigateToDetails}
                            onEdit={handleOpenEdit}
                            onDelete={openDeleteDialog}
                          />
                        ))}
                      </div>
                      <DragOverlay>
                        {activeProject ? <ProjectCardPreview project={activeProject} /> : null}
                      </DragOverlay>
                    </DndContext>
                  </section>
                )}
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  Usa el mouse o el teclado (Tab + flechas + Espacio/Enter) para mover los proyectos
                  entre columnas.
                </p>
              </TabsContent>

              <TabsContent value="table" className="mt-0 border-0 bg-transparent p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" label="Cargando proyectos..." />
                  </div>
                ) : error ? (
                  <div className="text-destructive py-12 text-center">
                    {error instanceof Error
                      ? error.message
                      : "No se pudieron cargar los proyectos."}
                  </div>
                ) : (
                  <section className="space-y-4">
                    <div className="xl:hidden">
                      {projects.length === 0 ? (
                        <div className="text-muted-foreground rounded-lg border border-dashed border-[rgba(28,36,49,0.15)] bg-white p-6 text-center text-sm">
                          No se encontraron proyectos.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {projects.map((project, index) => (
                            <ProjectMobileCard
                              key={project.id}
                              project={project}
                              onView={handleNavigateToDetails}
                              onEdit={handleOpenEdit}
                              onDelete={openDeleteDialog}
                              isDeleting={
                                deleteProject.isPending && projectPendingDeletion?.id === project.id
                              }
                              className={index < 4 ? `stagger-${index + 1}` : undefined}
                            />
                          ))}
                        </div>
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
                      <div
                        ref={tableScrollRef}
                        className="horizontal-scroll-container rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-5 shadow-sm md:p-6"
                      >
                        <Table className="w-full table-auto">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead>Estatus</TableHead>
                              <TableHead>Prioridad</TableHead>
                              <TableHead>Tareas</TableHead>
                              <TableHead>Creado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>{renderProjectTableRows()}</TableBody>
                        </Table>
                      </div>
                    </div>
                  </section>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog
          open={isCreateModalOpen}
          onOpenChange={(open: boolean) => {
            setIsCreateModalOpen(open);
            if (!open) {
              resetCreateForm();
            }
          }}
        >
          <DialogContent className="max-h-[90vh] space-y-4 overflow-y-auto sm:space-y-5">
            <DialogHeader>
              <DialogTitle>Crear proyecto</DialogTitle>
            </DialogHeader>

            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del proyecto"
                          disabled={createProject.isPending}
                          {...field}
                        />
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
                          placeholder="Descripción opcional del proyecto"
                          disabled={createProject.isPending}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estatus</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ProjectStatus)}
                        disabled={createProject.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estatus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROJECT_STATUS_OPTIONS.map((option) => (
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
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        disabled={createProject.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar prioridad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROJECT_PRIORITY_OPTIONS.map((option) => (
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

                {createForm.formState.errors.root ? (
                  <p className="text-destructive text-sm" role="alert">
                    {createForm.formState.errors.root.message}
                  </p>
                ) : null}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={createProject.isPending}>
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" variant="secondary" disabled={createProject.isPending}>
                    {createProject.isPending ? "Creando..." : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open: boolean) => {
            setIsEditModalOpen(open);
            if (!open) {
              closeEditModal();
            }
          }}
        >
          <DialogContent className="max-h-[90vh] space-y-4 overflow-y-auto sm:space-y-5">
            <DialogHeader>
              <DialogTitle>Editar proyecto</DialogTitle>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del proyecto"
                          disabled={updateProject.isPending}
                          {...field}
                        />
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
                          placeholder="Descripción opcional del proyecto"
                          disabled={updateProject.isPending}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estatus</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ProjectStatus)}
                        disabled={updateProject.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estatus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROJECT_STATUS_OPTIONS.map((option) => (
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
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        disabled={updateProject.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar prioridad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROJECT_PRIORITY_OPTIONS.map((option) => (
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

                {editForm.formState.errors.root ? (
                  <p className="text-destructive text-sm" role="alert">
                    {editForm.formState.errors.root.message}
                  </p>
                ) : null}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={updateProject.isPending}>
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" variant="secondary" disabled={updateProject.isPending}>
                    {updateProject.isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeDeleteDialog();
            }
          }}
        >
          <DialogContent className="space-y-4 sm:space-y-5">
            <DialogHeader>
              <DialogTitle>Eliminar proyecto</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El proyecto y sus tareas se eliminarán de forma
                permanente.
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm font-medium text-[#1C2431]">
              {projectPendingDeletion ? projectPendingDeletion.name : "Proyecto seleccionado"}
            </p>
            {deleteError ? <p className="text-destructive text-sm">{deleteError}</p> : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={deleteProject.isPending}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleConfirmDelete()}
                disabled={deleteProject.isPending}
              >
                {deleteProject.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
};

export default ProjectsPage;
