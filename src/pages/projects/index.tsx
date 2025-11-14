import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button, KanbanBoard, Layout, ProtectedRoute } from "@/components";
import type { CardRenderProps } from "@/components/kanban-board";
import {
  Badge,
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
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
} from "@/constants";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks";
import type { ProjectStatus, ProjectWithTaskCount } from "@/types";
import { cn, formatTaskDateTime } from "@/utils";

import { ProjectBoardCard, ProjectBoardCardPreview } from "./project-board-card";
import { ProjectMobileCard } from "./project-mobile-card";
import { DeleteProjectDialog, ProjectFormModal } from "./project-modals";
import {
  defaultFormValues,
  mapProjectToFormValues,
  projectSchema,
  resolveProjectStatus,
  resolveProjectViewMode,
  STATUSES,
  STATUS_TITLES,
  type ProjectFormInput,
  type ProjectSchema,
} from "./project-schema";

function ProjectsPage() {
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
  const activeView = useMemo(
    () => resolveProjectViewMode(searchParams.get("view")),
    [searchParams],
  );

  const { data: projects = [], isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const createForm = useForm<ProjectFormInput, undefined, ProjectSchema>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<ProjectFormInput, undefined, ProjectSchema>({
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

  const openDeleteDialog = useCallback((project: ProjectWithTaskCount) => {
    setProjectPendingDeletion(project);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  }, []);

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

  const handleNavigateToDetails = useCallback(
    (project: ProjectWithTaskCount) => {
      navigate(`/projects/${project.id}`);
    },
    [navigate],
  );

  const handleOpenEdit = useCallback((project: ProjectWithTaskCount) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  }, []);

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

  const getProjectTitle = useCallback((project: ProjectWithTaskCount) => project.name, []);

  const handleProjectStatusChange = useCallback(
    async (projectId: number, newStatus: ProjectStatus) => {
      try {
        await updateProject.mutateAsync({ projectId, data: { status: newStatus } });
      } catch {
        // mutation hook reports errors; nothing else here
      }
    },
    [updateProject],
  );

  const renderProjectBoardCard = useCallback(
    (props: CardRenderProps<ProjectWithTaskCount, ProjectStatus>) => (
      <ProjectBoardCard
        {...props}
        onView={handleNavigateToDetails}
        onEdit={handleOpenEdit}
        onDelete={openDeleteDialog}
      />
    ),
    [handleNavigateToDetails, handleOpenEdit, openDeleteDialog],
  );

  const renderProjectBoardPreview = useCallback(
    (project: ProjectWithTaskCount) => <ProjectBoardCardPreview project={project} />,
    [],
  );

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
          <div className="truncate" title={project.name}>
            {project.name}
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground max-w-md text-sm">
          <div className="truncate" title={project.description ?? "Sin descripción"}>
            {project.description ? project.description : "Sin descripción"}
          </div>
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
        <div className="text-foreground px-0 sm:py-4 md:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Tabs value={activeView} onValueChange={handleViewChange}>
              <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:flex-nowrap">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold">Proyectos</h1>
                  <p className="text-muted-foreground text-sm">
                    Organiza tu trabajo en proyectos, sigue el avance de las tareas y mantente al
                    día con tus entregas.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:flex-nowrap lg:gap-4">
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
                    className="w-full sm:ml-3 sm:w-auto lg:ml-4"
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
                  <section className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4 shadow-sm md:p-5">
                    <KanbanBoard
                      items={projects}
                      statuses={STATUSES}
                      statusTitles={STATUS_TITLES}
                      emptyColumnMessage="No hay proyectos en esta columna"
                      resolveStatus={resolveProjectStatus}
                      onStatusChange={handleProjectStatusChange}
                      getItemTitle={getProjectTitle}
                      renderCard={renderProjectBoardCard}
                      renderPreview={renderProjectBoardPreview}
                      isUpdating={updateProject.isPending}
                    />
                  </section>
                )}
                <p className="text-muted-foreground mt-3 hidden text-center text-xs md:block">
                  Puedes reordenar con mouse o teclado (Tab + flechas + Espacio/Enter) y, en
                  pantallas pequeñas, usar el menú “Mover a” de cada tarjeta para cambiar su
                  estatus.
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
                        <div className="space-y-4 will-change-transform">
                          {projects.map((project) => (
                            <ProjectMobileCard
                              key={project.id}
                              project={project}
                              onView={handleNavigateToDetails}
                              onEdit={handleOpenEdit}
                              onDelete={openDeleteDialog}
                              isDeleting={
                                deleteProject.isPending && projectPendingDeletion?.id === project.id
                              }
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

        <ProjectFormModal
          isOpen={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          form={createForm}
          onSubmit={handleCreateSubmit}
          isPending={createProject.isPending}
          title="Crear proyecto"
          submitLabel="Crear"
          onClose={closeCreateModal}
        />

        <ProjectFormModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          form={editForm}
          onSubmit={handleEditSubmit}
          isPending={updateProject.isPending}
          title="Editar proyecto"
          submitLabel="Guardar cambios"
          onClose={closeEditModal}
        />

        <DeleteProjectDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          projectName={projectPendingDeletion?.name ?? null}
          onConfirm={handleConfirmDelete}
          onClose={closeDeleteDialog}
          isDeleting={deleteProject.isPending}
          error={deleteError}
        />
      </Layout>
    </ProtectedRoute>
  );
}

export default ProjectsPage;
