import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
      .min(1, "El nombre es requerido.")
      .max(255, "El nombre debe tener 255 caracteres o menos."),
    type: z.enum(["person", "company"]),
    value: z.coerce
      .number()
      .refine((val) => !Number.isNaN(val), { message: "El valor debe ser un número." })
      .gt(0, { message: "El valor debe ser positivo." }),
    startDate: z
      .string()
      .min(1, "La fecha de inicio es requerida.")
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "La fecha de inicio debe ser una fecha válida.",
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
          message: "La fecha de fin debe ser una fecha válida.",
        },
      ),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && Date.parse(data.endDate) <= Date.parse(data.startDate)) {
      ctx.addIssue({
        path: ["endDate"],
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin debe ser posterior a la fecha de inicio.",
      });
    }
  });

type ClientFormInput = z.input<typeof clientSchema>;
type ClientFormSchema = z.output<typeof clientSchema>;

const defaultFormValues: ClientFormInput = {
  name: "",
  type: "person",
  value: 0,
  startDate: formatClientDateForInput(new Date()),
  endDate: null,
};

type EditingCell = {
  clientId: string;
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
  const clients = useMemo(() => data?.clients ?? [], [data?.clients]);
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

  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  const createForm = useForm<ClientFormInput, undefined, ClientFormSchema>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultFormValues,
  });

  const editForm = useForm<ClientFormInput, undefined, ClientFormSchema>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (!editingCell) {
      editInputRef.current = null;
    }
  }, [editingCell]);

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
  }, [clients, updateScrollIndicators]);

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
        mutationError instanceof Error ? mutationError.message : "No se pudo crear el cliente.";
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
        mutationError instanceof Error
          ? mutationError.message
          : "No se pudo actualizar el cliente.";
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
        mutationError instanceof Error ? mutationError.message : "No se pudo eliminar el cliente.";
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
        setActionError("El nombre no puede estar vacío.");
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
        setActionError("El valor debe ser positivo.");
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
        setActionError("La fecha de inicio es requerida.");
        return;
      }
      if (nextValue === formatClientDateForInput(currentClient.startDate)) {
        handleEditCancel();
        return;
      }
      const parsedStart = new Date(nextValue);
      if (Number.isNaN(parsedStart.getTime())) {
        setActionError("La fecha de inicio debe ser una fecha válida.");
        return;
      }
      if (currentClient.endDate) {
        const existingEnd =
          currentClient.endDate instanceof Date
            ? currentClient.endDate
            : new Date(currentClient.endDate);
        if (Number.isNaN(existingEnd.getTime())) {
          setActionError("La fecha de fin debe ser una fecha válida.");
          return;
        }
        if (existingEnd.getTime() <= parsedStart.getTime()) {
          setActionError("La fecha de fin debe ser posterior a la fecha de inicio.");
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
          setActionError("La fecha de fin debe ser una fecha válida.");
          return;
        }
        const startDateValue =
          currentClient.startDate instanceof Date
            ? currentClient.startDate
            : new Date(currentClient.startDate);
        if (Number.isNaN(startDateValue.getTime())) {
          setActionError("La fecha de inicio debe ser una fecha válida.");
          return;
        }
        if (parsedEnd.getTime() <= startDateValue.getTime()) {
          setActionError("La fecha de fin debe ser posterior a la fecha de inicio.");
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
        mutationError instanceof Error
          ? mutationError.message
          : "No se pudo actualizar el cliente.";
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
          className="w-full cursor-pointer text-left transition-colors hover:bg-[rgba(28,36,49,0.04)]"
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
            <SelectValue placeholder="Seleccionar tipo" />
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

  const handleOpenDelete = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
    setActionError(null);
  };

  type ClientMobileCardProps = {
    client: Client;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
    isDeleting: boolean;
  };

  const ClientMobileCard = ({ client, onEdit, onDelete, isDeleting }: ClientMobileCardProps) => (
    <article className="space-y-4 rounded-lg border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-sm">
      <header className="space-y-2">
        <h3 className="truncate text-lg font-semibold text-[#1C2431] ...">{client.name}</h3>
        <Badge className={cn("uppercase", CLIENT_TYPE_COLORS[client.type])}>
          {CLIENT_TYPE_LABELS[client.type]}
        </Badge>
      </header>
      <div className="text-muted-foreground grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <div className="space-y-1">
          <p className="text-foreground text-xs font-semibold tracking-wide uppercase">Valor</p>
          <p>{formatCurrencyDOP(client.value)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-foreground text-xs font-semibold tracking-wide uppercase">Desde</p>
          <p>{formatClientDate(client.startDate)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-foreground text-xs font-semibold tracking-wide uppercase">Hasta</p>
          <p>{formatClientDate(client.endDate)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Button type="button" variant="outline" className="w-full" onClick={() => onEdit(client)}>
          Editar
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={() => onDelete(client)}
          disabled={isDeleting}
        >
          {isDeleting ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>
    </article>
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-foreground md:px-6">
          <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 px-4 py-4 md:px-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold">Clientes</h1>
                <p className="text-muted-foreground text-sm">
                  Gestiona tus clientes, registra fechas clave y monitorea el valor asociado.
                </p>
              </div>
              <Button onClick={openCreateModal} className="w-full sm:w-auto" variant="secondary">
                Crear Cliente
              </Button>
            </header>

            <section className="flex flex-col gap-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-5 shadow-sm sm:flex-row sm:flex-wrap sm:gap-5 md:p-6">
              <div className="w-full sm:max-w-xs">
                <Label
                  className="text-muted-foreground mb-2 block text-sm"
                  htmlFor="client-type-filter"
                >
                  Tipo
                </Label>
                <Select
                  value={(filters.type ?? "all") as string}
                  onValueChange={handleTypeFilterChange}
                >
                  <SelectTrigger id="client-type-filter">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
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

            <section className="space-y-4">
              <div className="xl:hidden">
                {isLoading ? (
                  <div className="text-muted-foreground rounded-lg border border-dashed border-[rgba(28,36,49,0.15)] bg-white p-6 text-center text-sm">
                    Cargando clientes...
                  </div>
                ) : error ? (
                  <div className="text-destructive rounded-lg border border-dashed border-[rgba(228,2,2,0.2)] bg-red-50 p-6 text-center text-sm">
                    Error al cargar clientes.
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-muted-foreground rounded-lg border border-dashed border-[rgba(28,36,49,0.15)] bg-white p-6 text-center text-sm">
                    No se encontraron clientes.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clients.map((client) => (
                      <ClientMobileCard
                        key={client.id}
                        client={client}
                        onEdit={handleEditOpen}
                        onDelete={handleOpenDelete}
                        isDeleting={deleteClient.isPending && clientToDelete?.id === client.id}
                      />
                    ))}
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor (DOP)</TableHead>
                        <TableHead>Desde</TableHead>
                        <TableHead>Hasta</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell className="py-8 text-center" colSpan={6}>
                            <span className="text-muted-foreground text-sm">
                              Cargando clientes...
                            </span>
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell className="py-8 text-center" colSpan={6}>
                            <span className="text-destructive text-sm">
                              Error al cargar clientes.
                            </span>
                          </TableCell>
                        </TableRow>
                      ) : clients.length === 0 ? (
                        <TableRow>
                          <TableCell className="py-8 text-center" colSpan={6}>
                            <span className="text-muted-foreground text-sm">
                              No se encontraron clientes.
                            </span>
                          </TableCell>
                        </TableRow>
                      ) : (
                        clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="max-w-xs">
                              {renderEditableCell(
                                client,
                                "name",
                                <span className="truncate font-medium" title={client.name}>
                                  {client.name}
                                </span>,
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
                                  Editar
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleOpenDelete(client)}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between md:px-6">
                <p className="text-muted-foreground text-sm">
                  Página {pagination.page} de {pagination.totalPages || 1} ({pagination.total}{" "}
                  total)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoPrevious}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoNext}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={handleCreateOpenChange}>
          <DialogContent className="max-h-[90vh] space-y-4 overflow-y-auto sm:space-y-5">
            <DialogHeader>
              <DialogTitle>Crear Cliente</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del cliente" {...field} />
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
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
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
                      <FormLabel>Valor (DOP)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={
                            typeof field.value === "number" || typeof field.value === "string"
                              ? field.value
                              : ""
                          }
                          onChange={(event) => field.onChange(event.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
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
                        <FormLabel>Fecha de Inicio</FormLabel>
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
                        <FormLabel>Fecha de Fin</FormLabel>
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
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={createClient.isPending}>
                    {createClient.isPending ? "Creando..." : "Crear Cliente"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={handleEditOpenChange}>
          <DialogContent className="max-h-[90vh] space-y-4 overflow-y-auto sm:space-y-5">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del cliente" {...field} />
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
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
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
                      <FormLabel>Valor (DOP)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={
                            typeof field.value === "number" || typeof field.value === "string"
                              ? field.value
                              : ""
                          }
                          onChange={(event) => field.onChange(event.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
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
                        <FormLabel>Fecha de Inicio</FormLabel>
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
                        <FormLabel>Fecha de Fin</FormLabel>
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
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={updateClient.isPending}>
                    {updateClient.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteModalOpen} onOpenChange={handleDeleteOpenChange}>
          <DialogContent className="space-y-4 sm:space-y-5">
            <DialogHeader>
              <DialogTitle>Eliminar Cliente</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              ¿Estás seguro de que quieres eliminar "{clientToDelete?.name ?? "este cliente"}"? Esta
              acción no se puede deshacer.
            </p>
            {deleteError ? <p className="text-destructive text-sm">{deleteError}</p> : null}
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleConfirmDelete()}
                disabled={deleteClient.isPending}
              >
                {deleteClient.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
}

export default ClientsPage;
