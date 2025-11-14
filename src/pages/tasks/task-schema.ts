import { z } from "zod";

import type { Task, TaskFilters, TaskFormValues, TaskPriority, TaskStatus } from "@/types";
import { formatDateForInput, resolveStatusValue } from "@/utils";

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es requerido.")
    .max(255, "El título debe tener 255 caracteres o menos."),
  description: z
    .string()
    .max(2000, "La descripción debe tener 2000 caracteres o menos.")
    .optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.union([z.enum(["low", "medium", "high"]), z.literal("none")]).optional(),
  dueDate: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Fecha de Vencimiento no válida.",
    }),
  projectId: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        value === "none" ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
      {
        message: "Selección de proyecto no válida.",
      },
    ),
});

export type TaskFormSchema = z.infer<typeof taskSchema>;

export const defaultFormValues: TaskFormSchema = {
  title: "",
  description: "",
  status: "todo",
  priority: "none",
  dueDate: "",
  projectId: "none",
};

export const isTaskPriority = (value: string): value is TaskPriority =>
  value === "low" || value === "medium" || value === "high";

export const toSchemaValues = (task: Task): TaskFormSchema => ({
  title: task.title,
  description: task.description ?? "",
  status: task.status,
  priority: task.priority && isTaskPriority(task.priority) ? task.priority : "none",
  dueDate: formatDateForInput(task.dueDate),
  projectId: task.projectId !== null ? task.projectId : "none",
});

export const mapSchemaToTask = (values: TaskFormSchema): TaskFormValues => ({
  title: values.title.trim(),
  description:
    values.description && values.description.trim().length > 0 ? values.description.trim() : null,
  status: values.status,
  priority:
    values.priority && values.priority !== "none" && isTaskPriority(values.priority)
      ? values.priority
      : null,
  dueDate: values.dueDate && values.dueDate.length > 0 ? values.dueDate : null,
  projectId: values.projectId && values.projectId !== "none" ? values.projectId : null,
});

export const TASK_BOARD_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];

export const TASK_BOARD_STATUS_TITLES: Record<TaskStatus, string> = {
  todo: "Por Hacer",
  in_progress: "En Progreso",
  done: "Completado",
};

export const resolveTaskBoardStatus = (value: unknown): TaskStatus | null =>
  resolveStatusValue<TaskStatus>(value, TASK_BOARD_STATUSES);

export type TaskViewMode = "table" | "board";

export const resolveViewMode = (value: string | null | undefined): TaskViewMode =>
  value === "table" ? "table" : "board";

export const DEFAULT_FILTERS: TaskFilters = {
  status: "all",
  priority: "all",
  projectId: "all",
};
