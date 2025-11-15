import { Badge, Button } from "@/components/ui";
import { FILE_CATEGORY_LABELS } from "@/constants";
import type { StoredFile } from "@/types";
import { cn, formatFileDate, formatFileSize, getFileCategory, getFileCategoryIcon } from "@/utils";
import TruncateText from "@/utils/truncate-text";
import { CATEGORY_ICONS } from "./icons";

export type FileMobileCardProps = {
  file: StoredFile;
  projectName: string;
  isDownloading: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  onDownload: (file: StoredFile) => void;
  onDelete: (file: StoredFile) => void;
  onEdit: (file: StoredFile) => void;
};

export default function FileMobileCard({
  file,
  projectName,
  isDownloading,
  isDeleting,
  isEditing,
  onDownload,
  onDelete,
  onEdit,
}: FileMobileCardProps) {
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
  const truncatedProjectName = TruncateText(projectName, { maxLength: 60 });

  return (
    <article className="space-y-4 rounded-lg border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm">
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
        <p className="line-clamp-2">
          {file.description && file.description.length > 0 ? file.description : "Sin descripción"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("uppercase", badgeClass)}>{categoryLabel}</Badge>

          <span
            className="max-w-60 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-[#1C2431] ..."
            title={projectName}
          >
            Proyecto: {truncatedProjectName}
          </span>
        </div>
      </div>

      <dl className="text-muted-foreground grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <dt className="text-foreground text-xs font-semibold tracking-wide uppercase">Tamaño</dt>
          <dd>{formatFileSize(file.size)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-foreground text-xs font-semibold tracking-wide uppercase">Subido</dt>
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
          variant="secondary"
          className="w-full justify-center"
          onClick={() => onEdit(file)}
        >
          {isEditing ? "Guardando..." : "Editar"}
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
}
