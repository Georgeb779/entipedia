import type { UseFormReturn } from "react-hook-form";

import {
  Button,
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { PROJECT_PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS } from "@/constants";
import type { ProjectStatus } from "@/types";

import type { ProjectFormInput, ProjectSchema } from "./project-schema";

type ProjectFormModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ProjectFormInput, undefined, ProjectSchema>;
  onSubmit: (values: ProjectSchema) => Promise<void>;
  isPending: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
};

export function ProjectFormModal({
  isOpen,
  onOpenChange,
  form,
  onSubmit,
  isPending,
  title,
  submitLabel,
  onClose,
}: ProjectFormModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        onOpenChange(open);
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] space-y-4 overflow-y-auto sm:space-y-5">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[100px] resize-none"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estatus</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as ProjectStatus)}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estatus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-destructive text-sm" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? `${submitLabel}...` : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteProjectDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting: boolean;
  error: string | null;
};

export function DeleteProjectDialog({
  isOpen,
  onOpenChange,
  projectName,
  onConfirm,
  onClose,
  isDeleting,
  error,
}: DeleteProjectDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        onOpenChange(open);
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar proyecto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el proyecto {projectName ? `"${projectName}"` : ""}
            ? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
