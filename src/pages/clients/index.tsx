import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Layout, ProtectedRoute } from "@/components";
import {
  Badge,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { CLIENT_TYPE_COLORS, CLIENT_TYPE_LABELS, CLIENT_TYPE_OPTIONS } from "@/constants";
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from "@/hooks";
import type { Client, ClientFilters, ClientFormValues, ClientType } from "@/types";
import {
  cn,
  formatClientDate,
  formatClientDateForInput,
  formatCurrencyDOP,
  parseCurrencyDOP,
} from "@/utils";

const clientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(255, "Name must be 255 characters or fewer."),
    type: z.enum(["person", "company"]),
    value: z.coerce
      .number({ invalid_type_error: "Value must be a number." })
      .positive("Value must be positive."),
    startDate: z
      .string()
      .min(1, "Start date is required.")
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Start date must be a valid date.",
      }),
    endDate: z
      .union([z.string().min(1), z.literal(""), z.null()])
      .optional()
      .transform((value) => (value === "" ? null : (value ?? null)))
      .refine(
        (value) => {
          if (!value) {
            return true;
          }
          return !Number.isNaN(Date.parse(value));
        },
        {
          message: "End date must be a valid date.",
        },
      ),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && Date.parse(data.endDate) <= Date.parse(data.startDate)) {
      ctx.addIssue({
        path: ["endDate"],
        code: z.ZodIssueCode.custom,
        message: "End date must be after the start date.",
      });
    }
  });

type ClientFormSchema = z.infer<typeof clientSchema>;

const defaultFormValues: ClientFormSchema = {
  name: "",
  type: "person",
  value: 0,
  startDate: formatClientDateForInput(new Date()),
  endDate: null,
};

type EditingCell = {
  clientId: number;
  field: keyof ClientFormValues;
};

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type EditableField = keyof Pick<
  ClientFormValues,
  "name" | "type" | "value" | "startDate" | "endDate"
>;

function ClientsPage() {
  const [filters, setFilters] = useState<ClientFilters>({
    page: 1,
    limit: 10,
    type: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientBeingEdited, setClientBeingEdited] = useState<Client | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, error } = useClients(filters);
  const clients = data?.clients ?? [];
  const pagination: PaginationInfo = useMemo(
    () =>
      data?.pagination ?? {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        total: 0,
        totalPages: 0,
      },
    [data, filters.limit, filters.page],
  );

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const createForm = useForm<ClientFormSchema>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<ClientFormSchema>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (!editingCell) {
      editInputRef.current = null;
    }
  }, [editingCell]);

  const openCreateModal = () => {
    setActionError(null);
    createForm.reset(defaultFormValues);
    createForm.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleCreateOpenChange = (open: boolean) => {
    if (!open) {
      setIsCreateModalOpen(false);
      createForm.reset(defaultFormValues);
      createForm.clearErrors();
      return;
    }

    openCreateModal();
  };

  const handleCreateSubmit = async (values: ClientFormSchema) => {
    setActionError(null);
    createForm.clearErrors("root");

    try {
      await createClient.mutateAsync({
        name: values.name.trim(),
        type: values.type,
        value: parseCurrencyDOP(values.value),
        startDate: values.startDate,
        endDate: values.endDate,
      });
      setIsCreateModalOpen(false);
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Failed to create client.";
      createForm.setError("root", { message });
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setClientBeingEdited(null);
    setEditingCell(null);
    setEditValue("");
    editForm.reset(defaultFormValues);
    editForm.clearErrors();
  };

  const handleEditOpen = (client: Client) => {
    setActionError(null);
    setEditingCell(null);
    setEditValue("");
    setClientBeingEdited(client);
    editForm.reset({
      name: client.name,
      type: client.type,
      value: client.value / 100,
      startDate: formatClientDateForInput(client.startDate),
      endDate: client.endDate ? formatClientDateForInput(client.endDate) : null,
    });
    editForm.clearErrors();
    setIsEditModalOpen(true);
  };

  const handleEditOpenChange = (open: boolean) => {
    if (!open) {
      closeEditModal();
      return;
    }

    if (clientBeingEdited) {
      handleEditOpen(clientBeingEdited);
    }
  };

  const handleEditSubmit = async (values: ClientFormSchema) => {
    if (!clientBeingEdited) {
      return;
    }

    setActionError(null);
    editForm.clearErrors("root");

    try {
      await updateClient.mutateAsync({
        clientId: clientBeingEdited.id,
        data: {
          name: values.name.trim(),
          type: values.type,
          value: parseCurrencyDOP(values.value),
          startDate: values.startDate,
          endDate: values.endDate,
        },
      });
      closeEditModal();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Failed to update client.";
      editForm.setError("root", { message });
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) {
      return;
    }

    setDeleteError(null);
    setActionError(null);

    try {
      await deleteClient.mutateAsync(clientToDelete.id);
      setFilters((current) => {
        const currentPage = current.page ?? 1;
        if (currentPage > 1 && clients.length === 1) {
          return {
            ...current,
            page: currentPage - 1,
          };
        }

        return current;
      });
      setClientToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Failed to delete client.";
      setDeleteError(message);
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) {
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      setDeleteError(null);
      return;
    }

    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleCellClick = (client: Client, field: EditableField) => {
    setActionError(null);

    const initialValue = (() => {
      switch (field) {
        case "name":
          return client.name;
        case "type":
          return client.type;
        case "value":
          return (client.value / 100).toString();
        case "startDate":
          return formatClientDateForInput(client.startDate);
        case "endDate":
          return client.endDate ? formatClientDateForInput(client.endDate) : "";
        default:
          return "";
      }
    })();

    setEditingCell({ clientId: client.id, field });
    setEditValue(initialValue ?? "");
  };

  const handleEditChange = (value: string) => {
    setEditValue(value);
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const commitEdit = async (overrideValue?: string) => {
    if (!editingCell) {
      return;
    }

    const currentClient = clients.find((client) => client.id === editingCell.clientId);

    if (!currentClient) {
      setEditingCell(null);
      return;
    }

    setActionError(null);

    const nextValue = overrideValue ?? editValue;
    const payload: Partial<ClientFormValues> = {};

    if (editingCell.field === "name") {
      const trimmed = nextValue.trim();
      if (!trimmed) {
        setActionError("Name cannot be empty.");
        return;
      }
      if (trimmed === currentClient.name) {
        handleEditCancel();
        return;
      }
      payload.name = trimmed;
    }

    if (editingCell.field === "type") {
      if (nextValue === currentClient.type) {
        handleEditCancel();
        return;
      }
      payload.type = nextValue as ClientType;
    }

    if (editingCell.field === "value") {
      const cents = parseCurrencyDOP(nextValue);
      if (cents <= 0) {
        setActionError("Value must be positive.");
        return;
      }
      if (cents === currentClient.value) {
        handleEditCancel();
        return;
      }
      payload.value = cents;
    }

    if (editingCell.field === "startDate") {
      if (!nextValue) {
        setActionError("Start date is required.");
        return;
      }
      if (nextValue === formatClientDateForInput(currentClient.startDate)) {
        handleEditCancel();
        return;
      }
      const parsedStart = new Date(nextValue);
      if (Number.isNaN(parsedStart.getTime())) {
        setActionError("Start date must be a valid date.");
        return;
      }
      if (currentClient.endDate) {
        const existingEnd =
          currentClient.endDate instanceof Date
            ? currentClient.endDate
            : new Date(currentClient.endDate);
        if (Number.isNaN(existingEnd.getTime())) {
          setActionError("End date must be a valid date.");
          return;
        }
        if (existingEnd.getTime() <= parsedStart.getTime()) {
          setActionError("End date must be after the start date.");
          return;
        }
      }
      payload.startDate = nextValue;
    }

    if (editingCell.field === "endDate") {
      const normalized = nextValue.length > 0 ? nextValue : null;
      const original = currentClient.endDate
        ? formatClientDateForInput(currentClient.endDate)
        : null;
      if (normalized === original) {
        handleEditCancel();
        return;
      }
      if (normalized) {
        const parsedEnd = new Date(normalized);
        if (Number.isNaN(parsedEnd.getTime())) {
          setActionError("End date must be a valid date.");
          return;
        }
        const startDateValue =
          currentClient.startDate instanceof Date
            ? currentClient.startDate
            : new Date(currentClient.startDate);
        if (Number.isNaN(startDateValue.getTime())) {
          setActionError("Start date must be a valid date.");
          return;
        }
        if (parsedEnd.getTime() <= startDateValue.getTime()) {
          setActionError("End date must be after the start date.");
          return;
        }
      }
      payload.endDate = normalized;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    try {
      await updateClient.mutateAsync({ clientId: editingCell.clientId, data: payload });
      handleEditCancel();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Failed to update client.";
      setActionError(message);
    }
  };

  const handleEditableKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitEdit();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleEditCancel();
    }
  };

  const renderEditableCell = (client: Client, field: EditableField, displayValue: ReactNode) => {
    const isEditing = editingCell?.clientId === client.id && editingCell.field === field;

    if (!isEditing) {
      return (
        <button
          type="button"
          onClick={() => handleCellClick(client, field)}
          className="w-full text-left"
        >
          {displayValue}
        </button>
      );
    }

    if (field === "type") {
      return (
        <Select
          value={editValue as ClientType}
          onValueChange={(value) => {
            handleEditChange(value);
            void commitEdit(value);
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field === "value") {
      return (
        <Input
          ref={(node) => {
            if (node) {
              editInputRef.current = node;
              node.focus();
              node.select();
            }
          }}
          type="number"
          min="0"
          step="0.01"
          value={editValue}
          onChange={(event) => handleEditChange(event.target.value)}
          onBlur={() => {
            void commitEdit();
          }}
          onKeyDown={handleEditableKeyDown}
        />
      );
    }

    if (field === "startDate" || field === "endDate") {
      return (
        <Input
          ref={(node) => {
            if (node) {
              editInputRef.current = node;
              node.focus();
            }
          }}
          type="date"
          value={editValue}
          onChange={(event) => handleEditChange(event.target.value)}
          onBlur={() => {
            void commitEdit();
          }}
          onKeyDown={handleEditableKeyDown}
        />
      );
    }

    return (
      <Input
        ref={(node) => {
          if (node) {
            editInputRef.current = node;
            node.focus();
            node.select();
          }
        }}
        value={editValue}
        onChange={(event) => handleEditChange(event.target.value)}
        onBlur={() => {
          void commitEdit();
        }}
        onKeyDown={handleEditableKeyDown}
      />
    );
  };

  const handleTypeFilterChange = (value: string) => {
    setFilters((current) => ({
      ...current,
      page: 1,
      type: value as ClientFilters["type"],
    }));
  };

  const handlePageChange = (nextPage: number) => {
    setFilters((current) => ({
      ...current,
      page: nextPage,
    }));
  };

  const canGoPrevious = pagination.page > 1;
  const canGoNext = pagination.totalPages > 0 && pagination.page < pagination.totalPages;

  const createRootError = createForm.formState.errors.root?.message;
  const editRootError = editForm.formState.errors.root?.message;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground px-6 py-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-3xl font-semibold">Clients</h1>
                <p className="text-muted-foreground text-sm">
                  Track client relationships, engagement dates, and associated value.
                </p>
              </div>
              <Button onClick={openCreateModal}>Create Client</Button>
            </header>

            <section className="flex flex-wrap gap-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm">
              <div className="w-full max-w-xs">
                <Label
                  className="text-muted-foreground mb-2 block text-sm"
                  htmlFor="client-type-filter"
                >
                  Type
                </Label>
                <Select
                  value={(filters.type ?? "all") as string}
                  onValueChange={handleTypeFilterChange}
                >
                  <SelectTrigger id="client-type-filter">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {CLIENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {actionError ? <p className="text-destructive text-sm">{actionError}</p> : null}

            <section className="rounded-xl border border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor (DOP)</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Hasta</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell className="py-8 text-center" colSpan={6}>
                        <span className="text-muted-foreground text-sm">Loading clients...</span>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell className="py-8 text-center" colSpan={6}>
                        <span className="text-destructive text-sm">
                          {error instanceof Error ? error.message : "Failed to load clients."}
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-8 text-center" colSpan={6}>
                        <span className="text-muted-foreground text-sm">No clients found.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          {renderEditableCell(
                            client,
                            "name",
                            <span className="font-medium">{client.name}</span>,
                          )}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(
                            client,
                            "type",
                            <Badge className={cn("uppercase", CLIENT_TYPE_COLORS[client.type])}>
                              {CLIENT_TYPE_LABELS[client.type]}
                            </Badge>,
                          )}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(
                            client,
                            "value",
                            <span>{formatCurrencyDOP(client.value)}</span>,
                          )}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(
                            client,
                            "startDate",
                            <span>{formatClientDate(client.startDate)}</span>,
                          )}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(
                            client,
                            "endDate",
                            <span>{formatClientDate(client.endDate)}</span>,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditOpen(client)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setClientToDelete(client);
                                setIsDeleteModalOpen(true);
                                setDeleteError(null);
                                setActionError(null);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t border-[rgba(0,0,0,0.05)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoPrevious}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoNext}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={handleCreateOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Client</DialogTitle>
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
                        <Input placeholder="Client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLIENT_TYPE_OPTIONS.map((option) => (
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
                  control={createForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value (DOP)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={createForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {createRootError ? (
                  <p className="text-destructive text-sm">{createRootError}</p>
                ) : null}

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={createClient.isPending}>
                    {createClient.isPending ? "Creating..." : "Create Client"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={handleEditOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
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
                        <Input placeholder="Client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLIENT_TYPE_OPTIONS.map((option) => (
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
                  control={editForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value (DOP)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {editRootError ? <p className="text-destructive text-sm">{editRootError}</p> : null}

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={closeEditModal}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={updateClient.isPending}>
                    {updateClient.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteModalOpen} onOpenChange={handleDeleteOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Are you sure you want to delete "{clientToDelete?.name ?? "this client"}"? This action
              cannot be undone.
            </p>
            {deleteError ? <p className="text-destructive text-sm">{deleteError}</p> : null}
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleConfirmDelete()}
                disabled={deleteClient.isPending}
              >
                {deleteClient.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
}

export default ClientsPage;
