import { z } from "zod";

import type { ProjectStatus, ProjectWithTaskCount } from "@/types";
import { resolveStatusValue } from "@/utils";

export const projectSchema = z
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

export type ProjectFormInput = z.input<typeof projectSchema>;
export type ProjectSchema = z.output<typeof projectSchema>;

export const defaultFormValues: ProjectFormInput = {
  name: "",
  description: null,
  status: "todo",
  priority: "medium",
};

export const STATUSES: readonly ProjectStatus[] = ["todo", "in_progress", "done"];

export const STATUS_TITLES: Record<ProjectStatus, string> = {
  todo: "Por Hacer",
  in_progress: "En Progreso",
  done: "Completado",
};

export const mapProjectToFormValues = (project: ProjectWithTaskCount): ProjectFormInput => ({
  name: project.name,
  description: project.description ?? null,
  status: project.status,
  priority: project.priority,
});

export const resolveProjectStatus = (value: unknown): ProjectStatus | null =>
  resolveStatusValue<ProjectStatus>(value, STATUSES);

export type ProjectViewMode = "board" | "table";

export const resolveProjectViewMode = (value: string | null | undefined): ProjectViewMode =>
  value === "table" ? "table" : "board";
