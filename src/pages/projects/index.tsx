import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MoreHorizontal } from "lucide-react";

import { Button, Layout, ProtectedRoute } from "@/components";
import {
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from "@/components/ui";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "@/hooks";
import type { ProjectFilters, ProjectWithTaskCount } from "@/types";
import { calculateProjectProgress, formatTaskDate } from "@/utils";

const projectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required.")
      .max(255, "Project name must be 255 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer.")
      .optional()
      .nullable(),
  })
  .transform((values) => ({
    name: values.name.trim(),
    description: values.description ? values.description.trim() : null,
  }));

type ProjectSchema = z.infer<typeof projectSchema>;

const defaultFormValues: ProjectSchema = {
  name: "",
  description: null,
};

const defaultFilters: ProjectFilters = {
  sortBy: "createdAt",
  sortOrder: "desc",
};

const sortByOptions: Array<{ label: string; value: NonNullable<ProjectFilters["sortBy"]> }> = [
  { label: "Created Date", value: "createdAt" },
  { label: "Name", value: "name" },
  { label: "Task Count", value: "taskCount" },
];

const sortOrderOptions: Array<{
  label: string;
  value: NonNullable<ProjectFilters["sortOrder"]>;
}> = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
];

const mapProjectToFormValues = (project: ProjectWithTaskCount): ProjectSchema => ({
  name: project.name,
  description: project.description ?? null,
});

const ProjectsPage = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { editProjectId?: number } };

  const [filters, setFilters] = useState<ProjectFilters>(defaultFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithTaskCount | null>(null);
  const [projectPendingDeletion, setProjectPendingDeletion] = useState<ProjectWithTaskCount | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: projects = [], isLoading, error } = useProjects(filters);
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

  const sortedProjects = useMemo(() => projects, [projects]);

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
          mutationError instanceof Error ? mutationError.message : "Failed to create project.",
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
          mutationError instanceof Error ? mutationError.message : "Failed to update project.",
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
        mutationError instanceof Error ? mutationError.message : "Failed to delete project.";
      setDeleteError(message);
    }
  };

  const handleSortByChange = (value: string) => {
    setFilters((current) => ({
      ...current,
      sortBy: value as NonNullable<ProjectFilters["sortBy"]>,
    }));
  };

  const handleSortOrderChange = (value: string) => {
    setFilters((current) => ({
      ...current,
      sortOrder: value as NonNullable<ProjectFilters["sortOrder"]>,
    }));
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground px-6 py-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold">Projects</h1>
                <p className="text-muted-foreground text-sm">
                  Organize your work into projects, track task progress, and stay on top of
                  deadlines.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
                  Create Project
                </Button>
              </div>
            </header>

            <section className="bg-card flex flex-wrap gap-4 rounded-xl border border-[rgba(0,0,0,0.05)] p-4 shadow-sm">
              <div className="w-full max-w-xs">
                <Label className="text-muted-foreground">Sort By</Label>
                <Select value={filters.sortBy ?? "createdAt"} onValueChange={handleSortByChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Sort projects" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortByOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full max-w-xs">
                <Label className="text-muted-foreground">Order</Label>
                <Select value={filters.sortOrder ?? "desc"} onValueChange={handleSortOrderChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOrderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <Separator />

            <section>
              {isLoading ? (
                <div className="text-muted-foreground py-12 text-center">Loading projects...</div>
              ) : error ? (
                <div className="text-destructive py-12 text-center">
                  {error instanceof Error ? error.message : "Failed to load projects."}
                </div>
              ) : sortedProjects.length === 0 ? (
                <div className="bg-card text-muted-foreground rounded-xl p-12 text-center shadow-sm">
                  <p>No projects found. Create your first project to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sortedProjects.map((project) => {
                    const progress = calculateProjectProgress(
                      project.completedTaskCount,
                      project.taskCount,
                    );

                    const handleOpenEdit = () => {
                      setEditingProject(project);
                      setIsEditModalOpen(true);
                    };

                    const handleNavigateToDetails = () => {
                      navigate(`/projects/${project.id}`);
                    };

                    return (
                      <div
                        key={project.id}
                        className="flex h-full flex-col rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-full space-y-3">
                            <div className="flex items-baseline justify-between gap-3">
                              <h3 className="line-clamp-1 text-lg font-semibold text-[#1C2431]">
                                {project.name}
                              </h3>
                              <span className="text-sm font-semibold text-[#1C2431]">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[rgba(28,36,49,0.08)]">
                              <div
                                className="h-full rounded-full bg-[#E8B90D]"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-[#1C2431]"
                                aria-label="Project actions"
                              >
                                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-36">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  handleNavigateToDetails();
                                }}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  handleOpenEdit();
                                }}
                              >
                                Edit project
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(event) => {
                                  event.preventDefault();
                                  openDeleteDialog(project);
                                }}
                              >
                                Delete project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="text-muted-foreground mt-4 space-y-3 border-t border-[rgba(0,0,0,0.06)] pt-4 text-sm">
                          <p className="font-medium text-[#1C2431]">
                            {project.taskCount} tasks ({project.completedTaskCount} completed)
                          </p>
                          <p className="leading-relaxed">
                            {project.description ?? "No description provided."}
                          </p>
                          <p className="text-xs">Created {formatTaskDate(project.createdAt)}</p>
                          <p className="text-xs">Updated {formatTaskDate(project.updatedAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        <Dialog
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            setIsCreateModalOpen(open);
            if (!open) {
              resetCreateForm();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>

            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Project name"
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional project description"
                          disabled={createProject.isPending}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
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
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" variant="secondary" disabled={createProject.isPending}>
                    {createProject.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              closeEditModal();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Project name"
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional project description"
                          disabled={updateProject.isPending}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
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
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" variant="secondary" disabled={updateProject.isPending}>
                    {updateProject.isPending ? "Saving..." : "Save changes"}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The project and its tasks will be permanently removed.
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm font-medium text-[#1C2431]">
              {projectPendingDeletion ? projectPendingDeletion.name : "Selected project"}
            </p>
            {deleteError ? <p className="text-destructive text-sm">{deleteError}</p> : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={deleteProject.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleConfirmDelete()}
                disabled={deleteProject.isPending}
              >
                {deleteProject.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
};

export default ProjectsPage;
