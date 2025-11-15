import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { FILE_CATEGORY_LABELS } from "@/constants";
import type { ProjectWithTaskCount, StoredFile } from "@/types";
import { cn, formatFileDate, formatFileSize, getFileCategory, getFileCategoryIcon } from "@/utils";
import { CATEGORY_ICONS } from "./icons";
import * as React from "react";

type Props = {
  filteredFiles: StoredFile[];
  filesLoading: boolean;
  filesError: string | null;
  projectMap: Map<string, ProjectWithTaskCount>;
  tableScrollRef: React.RefObject<HTMLDivElement | null>;
  showLeftIndicator: boolean;
  showRightIndicator: boolean;
  downloadingId: string | null;
  onDownload: (file: StoredFile) => void;
  onEditOpen: (file: StoredFile) => void;
  onDeleteOpen: (file: StoredFile) => void;
  updateFileIsPending: boolean;
  editTargetId: string | null;
};

export default function FileTable({
  filteredFiles,
  filesLoading,
  filesError,
  projectMap,
  tableScrollRef,
  showLeftIndicator,
  showRightIndicator,
  downloadingId,
  onDownload,
  onEditOpen,
  onDeleteOpen,
  updateFileIsPending,
  editTargetId,
}: Props) {
  return (
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
        <Table className="table-auto">
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
                  <span className="text-muted-foreground text-sm">Cargando archivos...</span>
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
                  <span className="text-muted-foreground text-sm">No se encontraron archivos.</span>
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles.map((file) => {
                const category = getFileCategory(file.mimeType);
                const iconName = getFileCategoryIcon(category);
                const CategoryIcon = CATEGORY_ICONS[iconName] ?? CATEGORY_ICONS.File;
                const categoryLabel = FILE_CATEGORY_LABELS[category];
                const badgeClass =
                  category === "image"
                    ? "bg-[rgba(246,201,14,0.16)] text-[#1C2431]"
                    : category === "document"
                      ? "bg-[rgba(28,36,49,0.08)] text-[#1C2431]"
                      : category === "video"
                        ? "bg-[#E6F0FF] text-[#1C2431]"
                        : category === "audio"
                          ? "bg-[#E7F5E5] text-[#1C2431]"
                          : category === "archive"
                            ? "bg-[#FDE6E6] text-[#A61B1B]"
                            : "bg-[#F1F5F9] text-[#1C2431]";
                const projectName = file.projectId
                  ? (projectMap.get(file.projectId)?.name ?? "Proyecto desconocido")
                  : "Sin asignar";

                const isDownloading = downloadingId === file.id;
                const isEditing = updateFileIsPending && editTargetId === file.id;

                return (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onDownload(file)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(246,201,14,0.16)] text-[#c08600] transition-colors hover:bg-[rgba(246,201,14,0.26)] disabled:opacity-60"
                          disabled={isDownloading}
                          aria-label={`Descargar ${file.filename}`}
                        >
                          <CategoryIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <div className="max-w-[120px]">
                          <p className="truncate text-sm font-medium" title={file.filename}>
                            {file.filename}
                          </p>
                          <p
                            className="text-muted-foreground truncate text-xs"
                            title={file.mimeType}
                          >
                            {file.mimeType}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <div
                        className="truncate"
                        title={
                          file.description && file.description.length > 0
                            ? file.description
                            : "Sin descripción"
                        }
                      >
                        <span className="text-sm text-neutral-700">
                          {file.description && file.description.length > 0
                            ? file.description
                            : "Sin descripción"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("uppercase", badgeClass)}>{categoryLabel}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <div className="truncate" title={projectName}>
                        <span className="text-sm">{projectName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{formatFileDate(file.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(file)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? "Descargando..." : "Descargar"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onEditOpen(file)}
                        >
                          {isEditing ? "Guardando..." : "Editar"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteOpen(file)}
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
  );
}
