import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Archive,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  LucideIcon,
  Music,
  UploadCloud,
  Video,
} from "lucide-react";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@/components/ui";
import { ALLOWED_FILE_TYPES, FILE_CATEGORY_LABELS, MAX_FILE_SIZE } from "@/constants";
import { useDeleteFile, useDownloadFile, useFiles, useProjects, useUploadFile } from "@/hooks";
import type { FileCategory, FileFilters, ProjectWithTaskCount, StoredFile } from "@/types";
import {
  cn,
  formatFileDate,
  formatFileSize,
  getFileCategory,
  getFileCategoryIcon,
  validateFileSize,
  validateFileType,
} from "@/utils";

const uploadSchema = z.object({
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .default(""),
  projectId: z
    .union([z.literal("all"), z.string().regex(/^\d+$/, "Invalid project selection.")])
    .default("all"),
});

type UploadFormSchema = z.infer<typeof uploadSchema>;

type ProjectLookup = Map<number, ProjectWithTaskCount>;

type FileDialogState = {
  isOpen: boolean;
  target: StoredFile | null;
};

const iconComponents: Record<string, LucideIcon> = {
  Archive,
  File: FileIcon,
  FileText,
  Image: ImageIcon,
  Music,
  Video,
};

const categoryBadgeClasses: Record<FileCategory, string> = {
  image: "bg-[rgba(246,201,14,0.16)] text-[#1C2431]",
  document: "bg-[rgba(28,36,49,0.08)] text-[#1C2431]",
  video: "bg-[#E6F0FF] text-[#1C2431]",
  audio: "bg-[#E7F5E5] text-[#1C2431]",
  archive: "bg-[#FDE6E6] text-[#A61B1B]",
  other: "bg-[#F1F5F9] text-[#1C2431]",
};

const resolveCategoryIcon = (category: FileCategory): LucideIcon => {
  const iconName = getFileCategoryIcon(category);
  return iconComponents[iconName] ?? FileIcon;
};

const formatMaxUploadSize = () => formatFileSize(MAX_FILE_SIZE);

export default function FilesPage() {
  const [filters, setFilters] = useState<FileFilters>({ projectId: "all", mimeType: "all" });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<FileDialogState>({ isOpen: false, target: null });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadForm = useForm<UploadFormSchema>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      description: "",
      projectId: "all",
    },
  });

  const filesQuery = useFiles(filters);
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const downloadFile = useDownloadFile();
  const projectsQuery = useProjects({ sortBy: "name", sortOrder: "asc" });

  const projectMap: ProjectLookup = useMemo(() => {
    const map: ProjectLookup = new Map();
    (projectsQuery.data ?? []).forEach((project) => {
      map.set(project.id, project);
    });
    return map;
  }, [projectsQuery.data]);

  const files = useMemo(() => filesQuery.data ?? [], [filesQuery.data]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesProject = (() => {
        if (!filters.projectId || filters.projectId === "all") {
          return true;
        }

        if (typeof filters.projectId === "number") {
          return file.projectId === filters.projectId;
        }

        return true;
      })();

      const matchesMimeType = (() => {
        if (!filters.mimeType || filters.mimeType === "all") {
          return true;
        }

        return file.mimeType === filters.mimeType;
      })();

      return matchesProject && matchesMimeType;
    });
  }, [files, filters.mimeType, filters.projectId]);

  const mimeTypeOptions = useMemo(() => {
    const options = new Set<string>();
    files.forEach((file) => {
      options.add(file.mimeType);
    });
    return Array.from(options).sort();
  }, [files]);

  const projectOptions = useMemo(() => {
    return (projectsQuery.data ?? []).map((project) => ({
      id: project.id,
      name: project.name,
    }));
  }, [projectsQuery.data]);

  const uploadRootError = uploadForm.formState.errors.root?.message ?? null;

  const resetUploadState = () => {
    uploadForm.reset({ description: "", projectId: "all" });
    uploadForm.clearErrors();
    setSelectedFile(null);
    setIsDragOver(false);
  };

  const handleUploadOpenChange = (open: boolean) => {
    if (!open) {
      setUploadOpen(false);
      resetUploadState();
      return;
    }

    setUploadOpen(true);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteState({ isOpen: false, target: null });
      return;
    }

    setDeleteState((current) => ({ ...current, isOpen: true }));
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!validateFileType(file)) {
      uploadForm.setError("root", { type: "manual", message: "This file type is not supported." });
      return;
    }

    if (!validateFileSize(file)) {
      uploadForm.setError("root", {
        type: "manual",
        message: `File exceeds the ${formatMaxUploadSize()} limit.`,
      });
      return;
    }

    uploadForm.clearErrors("root");
    setSelectedFile(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0) ?? null;
    handleFileSelection(file);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.item(0) ?? null;
    handleFileSelection(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleUploadSubmit = uploadForm.handleSubmit(async (values) => {
    if (!selectedFile) {
      uploadForm.setError("root", { type: "manual", message: "Please choose a file to upload." });
      return;
    }

    const trimmedDescription = values.description.trim();
    const description = trimmedDescription.length > 0 ? trimmedDescription : null;
    const projectId = values.projectId === "all" ? null : Number.parseInt(values.projectId, 10);

    try {
      await uploadFile.mutateAsync({
        file: selectedFile,
        description,
        projectId,
      });
      setUploadOpen(false);
      resetUploadState();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload file.";
      uploadForm.setError("root", { type: "manual", message });
    }
  });

  const openDeleteDialog = (file: StoredFile) => {
    setActionError(null);
    setDeleteState({ isOpen: true, target: file });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteState.target) {
      return;
    }

    try {
      await deleteFile.mutateAsync(deleteState.target.id);
      setDeleteState({ isOpen: false, target: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete file.";
      setActionError(message);
    }
  };

  const handleDownload = async (file: StoredFile) => {
    setActionError(null);
    try {
      await downloadFile.mutateAsync({ fileId: file.id, filename: file.filename });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download file.";
      setActionError(message);
    }
  };

  const handleProjectFilterChange = (value: string) => {
    setFilters((current) => ({
      ...current,
      projectId: value === "all" ? "all" : Number.parseInt(value, 10),
    }));
  };

  const handleMimeTypeFilterChange = (value: string) => {
    setFilters((current) => ({
      ...current,
      mimeType: value,
    }));
  };

  const filesLoading = filesQuery.isLoading;
  const filesError = filesQuery.error instanceof Error ? filesQuery.error.message : null;
  const deleteDialogError = actionError && deleteState.isOpen ? actionError : null;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground px-6 py-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-3xl font-semibold">Files</h1>
                <p className="text-muted-foreground text-sm">
                  Securely store documents, media, and project assets in one place.
                </p>
              </div>
              <Button onClick={() => setUploadOpen(true)}>Upload File</Button>
            </header>

            <section className="flex flex-wrap gap-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm">
              <div className="w-full max-w-xs">
                <Label
                  className="text-muted-foreground mb-2 block text-sm"
                  htmlFor="project-filter"
                >
                  Project
                </Label>
                <Select
                  value={(filters.projectId ?? "all").toString()}
                  onValueChange={handleProjectFilterChange}
                >
                  <SelectTrigger id="project-filter">
                    <SelectValue placeholder="Filter by project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full max-w-xs">
                <Label className="text-muted-foreground mb-2 block text-sm" htmlFor="type-filter">
                  File type
                </Label>
                <Select
                  value={filters.mimeType ?? "all"}
                  onValueChange={handleMimeTypeFilterChange}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {mimeTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {actionError && !deleteState.isOpen ? (
              <p className="text-destructive text-sm">{actionError}</p>
            ) : null}

            <section className="rounded-xl border border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Tamano</TableHead>
                    <TableHead>Subido</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filesLoading ? (
                    <TableRow>
                      <TableCell className="py-8 text-center" colSpan={7}>
                        <span className="text-muted-foreground text-sm">Loading files...</span>
                      </TableCell>
                    </TableRow>
                  ) : filesError ? (
                    <TableRow>
                      <TableCell className="py-8 text-center" colSpan={7}>
                        <span className="text-destructive text-sm">{filesError}</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredFiles.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-8 text-center" colSpan={7}>
                        <span className="text-muted-foreground text-sm">No files found.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFiles.map((file) => {
                      const category = getFileCategory(file.mimeType);
                      const CategoryIcon = resolveCategoryIcon(category);
                      const categoryLabel = FILE_CATEGORY_LABELS[category];
                      const badgeClass = categoryBadgeClasses[category];
                      const projectName = file.projectId
                        ? (projectMap.get(file.projectId)?.name ?? "Unknown project")
                        : "Unassigned";

                      return (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => void handleDownload(file)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(246,201,14,0.16)] text-[#c08600] transition-colors hover:bg-[rgba(246,201,14,0.26)] disabled:opacity-60"
                                disabled={downloadFile.isPending}
                                aria-label={`Descargar ${file.filename}`}
                              >
                                <CategoryIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <div className="max-w-xs">
                                <p className="text-sm font-medium">{file.filename}</p>
                                <p className="text-muted-foreground text-xs">{file.mimeType}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-neutral-700">
                              {file.description && file.description.length > 0
                                ? file.description
                                : "Sin descripcion"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("uppercase", badgeClass)}>{categoryLabel}</Badge>
                          </TableCell>
                          <TableCell>{projectName}</TableCell>
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          <TableCell>{formatFileDate(file.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void handleDownload(file)}
                                disabled={downloadFile.isPending}
                              >
                                {downloadFile.isPending ? "Descargando..." : "Descargar"}
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteDialog(file)}
                                disabled={deleteFile.isPending}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </section>
          </div>
        </div>

        <Dialog open={uploadOpen} onOpenChange={handleUploadOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Attach documents or media. Supported size up to {formatMaxUploadSize()}.
              </DialogDescription>
            </DialogHeader>
            <Form {...uploadForm}>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/40 p-6 text-center transition-colors",
                      isDragOver ? "border-[#E8B90D] bg-[#fff7e0]" : "hover:border-[#E8B90D]",
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="rounded-full bg-[#E8B90D]/15 p-3 text-[#c08600]">
                      <UploadCloud className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Drag & drop your file here</p>
                      <p className="text-muted-foreground text-xs">
                        Images, documents, audio, video, and archives are supported.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleBrowseClick}>
                      Choose file
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ALLOWED_FILE_TYPES.join(",")}
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                  {selectedFile ? (
                    <div className="border-border mt-3 flex items-center justify-between rounded-lg border bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveSelectedFile}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </div>

                <FormField
                  control={uploadForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">No project</SelectItem>
                          {projectOptions.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={uploadForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional context for this file" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {uploadRootError ? (
                  <p className="text-destructive text-sm">{uploadRootError}</p>
                ) : null}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={uploadFile.isPending}>
                    {uploadFile.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteState.isOpen} onOpenChange={handleDeleteOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete File</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The file will be permanently removed from storage.
              </DialogDescription>
            </DialogHeader>
            <p className="text-foreground text-sm font-medium">
              {deleteState.target ? deleteState.target.filename : "Selected file"}
            </p>
            {deleteDialogError ? (
              <p className="text-destructive text-sm">{deleteDialogError}</p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDeleteConfirm()}
                disabled={deleteFile.isPending}
              >
                {deleteFile.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
}
