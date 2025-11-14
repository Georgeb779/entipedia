import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    .max(2000, "La descripción debe tener 2000 caracteres o menos.")
    .default(""),
  projectId: z
    .union([z.literal("all"), z.string().regex(/^\d+$/, "Selección de proyecto inválida.")])
    .default("all"),
});

type UploadFormInput = z.input<typeof uploadSchema>;
type UploadFormSchema = z.output<typeof uploadSchema>;

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
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  const uploadForm = useForm<UploadFormInput, undefined, UploadFormSchema>({
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
  }, [filteredFiles, updateScrollIndicators]);

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
      uploadForm.setError("root", {
        type: "manual",
        message: "Este tipo de archivo no es soportado.",
      });
      return;
    }

    if (!validateFileSize(file)) {
      uploadForm.setError("root", {
        type: "manual",
        message: `El archivo excede el ${formatMaxUploadSize()} límite.`,
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
      uploadForm.setError("root", {
        type: "manual",
        message: "Por favor elige un archivo para subir.",
      });
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
    } catch {
      uploadForm.setError("root", { type: "manual", message: "Error al subir el archivo." });
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
    } catch {
      setActionError("Error al eliminar el archivo.");
    }
  };

  const handleDownload = async (file: StoredFile) => {
    setActionError(null);
    try {
      await downloadFile.mutateAsync({ fileId: file.id, filename: file.filename });
    } catch {
      setActionError("Error al descargar el archivo.");
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
  const filesError = filesQuery.error ? "Error al cargar archivos." : null;
  const deleteDialogError = actionError && deleteState.isOpen ? actionError : null;

  type FileMobileCardProps = {
    file: StoredFile;
    projectName: string;
    onDownload: (file: StoredFile) => void;
    onDelete: (file: StoredFile) => void;
    isDownloading: boolean;
    isDeleting: boolean;
  };

  const FileMobileCard = ({
    file,
    projectName,
    onDownload,
    onDelete,
    isDownloading,
    isDeleting,
  }: FileMobileCardProps) => {
    const category = getFileCategory(file.mimeType);
    const CategoryIcon = resolveCategoryIcon(category);
    const categoryLabel = FILE_CATEGORY_LABELS[category];
    const badgeClass = categoryBadgeClasses[category];

    return (
      <article className="animate-card-fade-in space-y-4 rounded-lg border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm">
        <header className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(246,201,14,0.16)] text-[#c08600]">
            <CategoryIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-sm font-semibold text-[#1C2431]">{file.filename}</h3>
            <p className="text-muted-foreground text-xs">{file.mimeType}</p>
          </div>
        </header>

        <div className="text-muted-foreground space-y-2 text-sm">
          <p>
            {file.description && file.description.length > 0 ? file.description : "Sin descripción"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("uppercase", badgeClass)}>{categoryLabel}</Badge>
            <span className="text-xs text-[#1C2431]">{projectName}</span>
          </div>
        </div>

        <dl className="text-muted-foreground grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <dt className="text-foreground text-xs font-semibold tracking-wide uppercase">
              Tamaño
            </dt>
            <dd>{formatFileSize(file.size)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-foreground text-xs font-semibold tracking-wide uppercase">
              Subido
            </dt>
            <dd>{formatFileDate(file.createdAt)}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center"
            onClick={() => onDownload(file)}
            disabled={isDownloading}
          >
            {isDownloading ? "Descargando..." : "Descargar"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full justify-center"
            onClick={() => onDelete(file)}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </article>
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground md:px-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold">Archivos</h1>
                <p className="text-muted-foreground text-sm">
                  Almacena documentos, medios y recursos de proyectos en un solo lugar.
                </p>
              </div>
              <Button onClick={() => setUploadOpen(true)} className="w-full sm:w-auto">
                Subir Archivo
              </Button>
            </header>

            <section className="flex flex-col gap-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:gap-5 md:p-6">
              <div className="w-full sm:max-w-xs">
                <Label
                  className="text-muted-foreground mb-2 block text-sm"
                  htmlFor="project-filter"
                >
                  Proyecto
                </Label>
                <Select
                  value={(filters.projectId ?? "all").toString()}
                  onValueChange={handleProjectFilterChange}
                >
                  <SelectTrigger id="project-filter">
                    <SelectValue placeholder="Filtrar por proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:max-w-xs">
                <Label className="text-muted-foreground mb-2 block text-sm" htmlFor="type-filter">
                  Tipo de archivo
                </Label>
                <Select
                  value={filters.mimeType ?? "all"}
                  onValueChange={handleMimeTypeFilterChange}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
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

            <section className="space-y-4">
              <div className="xl:hidden">
                {filesLoading ? (
                  <div className="text-muted-foreground rounded-lg border border-dashed border-[rgba(28,36,49,0.15)] bg-white p-6 text-center text-sm">
                    Cargando archivos...
                  </div>
                ) : filesError ? (
                  <div className="text-destructive rounded-lg border border-dashed border-[rgba(166,27,27,0.25)] bg-red-50 p-6 text-center text-sm">
                    {filesError}
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-muted-foreground rounded-lg border border-dashed border-[rgba(28,36,49,0.15)] bg-white p-6 text-center text-sm">
                    No se encontraron archivos.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFiles.map((file) => {
                      const projectName = file.projectId
                        ? (projectMap.get(file.projectId)?.name ?? "Proyecto desconocido")
                        : "Sin asignar";
                      const isDeleting = deleteFile.isPending && deleteState.target?.id === file.id;

                      return (
                        <FileMobileCard
                          key={file.id}
                          file={file}
                          projectName={projectName}
                          onDownload={(target) => void handleDownload(target)}
                          onDelete={(target) => openDeleteDialog(target)}
                          isDownloading={downloadFile.isPending}
                          isDeleting={isDeleting}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="relative hidden xl:block">
                {showLeftIndicator ? (
                  <div className="scroll-indicator scroll-indicator-left" aria-hidden="true" />
                ) : null}
                {showRightIndicator ? (
                  <div className="scroll-indicator scroll-indicator-right" aria-hidden="true" />
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Tamaño</TableHead>
                        <TableHead>Subido</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filesLoading ? (
                        <TableRow>
                          <TableCell className="py-8 text-center" colSpan={7}>
                            <span className="text-muted-foreground text-sm">
                              Cargando archivos...
                            </span>
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
                            <span className="text-muted-foreground text-sm">
                              No se encontraron archivos.
                            </span>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFiles.map((file) => {
                          const category = getFileCategory(file.mimeType);
                          const CategoryIcon = resolveCategoryIcon(category);
                          const categoryLabel = FILE_CATEGORY_LABELS[category];
                          const badgeClass = categoryBadgeClasses[category];
                          const projectName = file.projectId
                            ? (projectMap.get(file.projectId)?.name ?? "Proyecto desconocido")
                            : "Sin asignar";

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
                                    : "Sin descripción"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("uppercase", badgeClass)}>
                                  {categoryLabel}
                                </Badge>
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
                                    Eliminar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </section>
          </div>
        </div>

        <Dialog open={uploadOpen} onOpenChange={handleUploadOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Archivo</DialogTitle>
              <DialogDescription>
                Adjunta documentos o medios. Tamaño soportado hasta {formatMaxUploadSize()}.
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
                      <p className="text-sm font-medium">Arrastra y suelta tu archivo aquí</p>
                      <p className="text-muted-foreground text-xs">
                        Se soportan imágenes, documentos, audio, video y archivos.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleBrowseClick}>
                      Elegir archivo
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
                        Quitar
                      </Button>
                    </div>
                  ) : null}
                </div>

                <FormField
                  control={uploadForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyecto</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proyecto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Sin proyecto</SelectItem>
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
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Contexto opcional para este archivo" {...field} />
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
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={uploadFile.isPending}>
                    {uploadFile.isPending ? "Subiendo..." : "Subir"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteState.isOpen} onOpenChange={handleDeleteOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Archivo</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El archivo será eliminado permanentemente del
                almacenamiento.
              </DialogDescription>
            </DialogHeader>
            <p className="text-foreground text-sm font-medium">
              {deleteState.target ? deleteState.target.filename : "Archivo seleccionado"}
            </p>
            {deleteDialogError ? (
              <p className="text-destructive text-sm">{deleteDialogError}</p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDeleteConfirm()}
                disabled={deleteFile.isPending}
              >
                {deleteFile.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
}
