import type { FileCategory } from "@/types";
import { getFileCategoryIcon } from "@/utils";
import {
  Archive,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Archive,
  File: FileIcon,
  FileText,
  Image: ImageIcon,
  Music,
  Video,
};

export function resolveCategoryIcon(category: FileCategory): LucideIcon {
  const iconName = getFileCategoryIcon(category);
  return CATEGORY_ICONS[iconName] ?? FileIcon;
}
