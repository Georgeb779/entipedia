import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Layout, ProtectedRoute } from "@/components";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

  const handleDeleteProject = async (project: ProjectWithTaskCount) => {
    const confirmed = window.confirm(
      `Delete project "${project.name}"? This will remove all tasks in the project as well.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject.mutateAsync(project.id);
    } catch (mutationError) {
      window.alert(
        mutationError instanceof Error ? mutationError.message : "Failed to delete project.",
      );
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

                    return (
                      <Card key={project.id} className="flex h-full flex-col shadow-sm">
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {project.description ?? "No description provided."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-4">
                          <div className="text-muted-foreground flex items-center justify-between text-sm">
                            <span>
                              {project.taskCount} tasks ({project.completedTaskCount} completed)
                            </span>
                            <Badge>{progress}% complete</Badge>
                          </div>
                          <div className="bg-muted h-2 w-full rounded-full">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-muted-foreground space-y-2 text-sm">
                            <p>Created {formatTaskDate(project.createdAt)}</p>
                            <p>Updated {formatTaskDate(project.updatedAt)}</p>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap justify-between gap-2">
                          <Link to={`/projects/${project.id}`} className="flex-1">
                            <Button className="w-full" variant="outline">
                              View Details
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingProject(project);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteProject(project)}
                          >
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
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
      </Layout>
    </ProtectedRoute>
  );
};

export default ProjectsPage;
