import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { cn } from "@/utils";
import { useIsMobile } from "@/hooks";

type CardContainerProps = Omit<HTMLAttributes<HTMLDivElement>, "ref" | "style"> & {
  ref: (element: HTMLElement | null) => void;
  style?: CSSProperties;
};

type DragHandleProps = HTMLAttributes<HTMLElement>;

export type CardRenderProps<
  TItem extends { id: number; status: TStatus },
  TStatus extends string,
> = {
  item: TItem;
  isActive: boolean;
  isDragging: boolean;
  containerProps: CardContainerProps;
  dragHandleProps: DragHandleProps;
  showDragHandle: boolean;
  onMoveStatus?: (newStatus: TStatus) => void;
};

type KanbanBoardProps<TItem extends { id: number; status: TStatus }, TStatus extends string> = {
  items: TItem[];
  /** Non-empty ordered collection of statuses to render columns for. */
  statuses: readonly TStatus[];
  /** Display titles for every status present in `statuses`. */
  statusTitles: Record<TStatus, string>;
  emptyColumnMessage: string;
  resolveStatus: (value: unknown) => TStatus | null;
  onStatusChange: (itemId: number, newStatus: TStatus) => void;
  getItemTitle: (item: TItem) => string;
  renderCard: (props: CardRenderProps<TItem, TStatus>) => ReactNode;
  renderPreview?: (item: TItem) => ReactNode;
  isUpdating?: boolean;
};

type KanbanColumnProps<TItem extends { id: number; status: TStatus }, TStatus extends string> = {
  title: string;
  status: TStatus;
  items: TItem[];
  activeId: number | null;
  isUpdating?: boolean;
  emptyColumnMessage: string;
  renderCard: (props: CardRenderProps<TItem, TStatus>) => ReactNode;
  onMoveStatus: (item: TItem, newStatus: TStatus) => void;
};

type SortableCardProps<TItem extends { id: number; status: TStatus }, TStatus extends string> = {
  item: TItem;
  activeId: number | null;
  renderCard: (props: CardRenderProps<TItem, TStatus>) => ReactNode;
  onMoveStatus: (item: TItem, newStatus: TStatus) => void;
};

const noopRef = () => {};

const EmptyPlaceholder = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
    <p className="text-muted-foreground flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-[rgba(28,36,49,0.15)] px-3 text-center text-sm">
      {message}
    </p>
  </div>
);

const SortableCard = <TItem extends { id: number; status: TStatus }, TStatus extends string>({
  item,
  activeId,
  renderCard,
  onMoveStatus,
}: SortableCardProps<TItem, TStatus>) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    data: { status: item.status },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
    userSelect: "none",
    willChange: "transform",
  };

  const containerProps = {
    ref: setNodeRef,
    style,
    ...attributes,
    "data-status": item.status,
  } as CardContainerProps;

  const dragHandleProps: DragHandleProps = {
    ...listeners,
  };

  return (
    <>
      {renderCard({
        item,
        isActive: activeId === item.id,
        isDragging,
        containerProps,
        dragHandleProps,
        showDragHandle: true,
        onMoveStatus: (newStatus) => onMoveStatus(item, newStatus),
      })}
    </>
  );
};

const KanbanColumn = <TItem extends { id: number; status: TStatus }, TStatus extends string>({
  title,
  status,
  items,
  activeId,
  isUpdating,
  emptyColumnMessage,
  renderCard,
  onMoveStatus,
}: KanbanColumnProps<TItem, TStatus>) => {
  const { isOver, setNodeRef } = useDroppable({ id: status, data: { status } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">{title}</h2>
        <span className="inline-flex h-6 min-w-8 items-center justify-center self-start rounded-full border border-neutral-200 bg-neutral-50 px-2 text-[11px] font-semibold text-neutral-700">
          {items.length}
        </span>
      </div>
      <SortableContext
        id={status}
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef} //TODO: CHECK
          className={cn(
            "flex min-h-[460px] flex-col gap-3 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[#f8f7f3] p-4 shadow-sm transition-all duration-200 md:min-h-[380px] md:p-3",
            isOver
              ? "drop-zone-active animate-pulse-ring ring-2 ring-yellow-300 ring-offset-1"
              : "drop-zone-idle",
            isUpdating ? "opacity-80" : "",
          )}
          aria-label={`Columna ${title}`}
          aria-busy={Boolean(isUpdating)}
          role="list"
        >
          {items.length === 0 ? (
            <EmptyPlaceholder message={emptyColumnMessage} />
          ) : (
            items.map((item) => (
              <SortableCard
                key={item.id}
                item={item}
                activeId={activeId}
                renderCard={renderCard}
                onMoveStatus={onMoveStatus}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const KanbanBoard = <TItem extends { id: number; status: TStatus }, TStatus extends string>({
  items,
  statuses,
  statusTitles,
  emptyColumnMessage,
  resolveStatus,
  onStatusChange,
  getItemTitle,
  renderCard,
  renderPreview,
  isUpdating = false,
}: KanbanBoardProps<TItem, TStatus>) => {
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<number | null>(null);
  const hasStatuses = statuses.length > 0;
  const emptyStatusesContent = useMemo(
    () => (
      <div className="text-muted-foreground rounded-xl border border-dashed border-[rgba(28,36,49,0.15)] bg-white p-6 text-center text-sm">
        No hay columnas configuradas.
      </div>
    ),
    [],
  );

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { distance: 15, delay: 250 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 12 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const buckets = useMemo(() => {
    const initial = statuses.reduce(
      (acc, status) => {
        acc[status] = [];
        return acc;
      },
      {} as Record<TStatus, TItem[]>,
    );

    items.forEach((item) => {
      const statusBucket = initial[item.status];
      if (Array.isArray(statusBucket)) {
        statusBucket.push(item);
      }
    });

    return initial;
  }, [items, statuses]);

  const itemLookup = useMemo(() => {
    const lookup = new Map<number, TItem>();
    items.forEach((item) => {
      lookup.set(item.id, item);
    });
    return lookup;
  }, [items]);

  const activeItem = useMemo(
    () => (activeId !== null ? (itemLookup.get(activeId) ?? null) : null),
    [activeId, itemLookup],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const sourceId = Number(event.active.id);
    if (Number.isInteger(sourceId)) {
      setActiveId(sourceId);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) {
        return;
      }

      const itemId = Number(active.id);
      if (!Number.isInteger(itemId)) {
        return;
      }

      const dataStatus = resolveStatus(
        (over.data?.current as { status?: unknown } | undefined)?.status ?? null,
      );
      const idStatus = resolveStatus(over.id);
      const nextStatus = dataStatus ?? idStatus;

      if (!nextStatus) {
        return;
      }

      const currentItem = itemLookup.get(itemId);
      if (!currentItem || currentItem.status === nextStatus) {
        return;
      }

      onStatusChange(itemId, nextStatus);
    },
    [itemLookup, onStatusChange, resolveStatus],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const onMoveStatus = useCallback(
    (item: TItem, newStatus: TStatus) => {
      if (item.status !== newStatus) {
        onStatusChange(item.id, newStatus);
      }
    },
    [onStatusChange],
  );

  const describeColumn = useCallback(
    (status: TStatus | null | undefined) => (status ? statusTitles[status] : undefined),
    [statusTitles],
  );

  const accessibility = useMemo(() => {
    const getItem = (id: unknown) => {
      const numericId = Number(id);
      if (!Number.isInteger(numericId)) {
        return undefined;
      }

      return itemLookup.get(numericId);
    };

    const resolveFromOver = (over: DragOverEvent["over"] | DragEndEvent["over"]) => {
      if (!over) {
        return null;
      }

      const dataStatus = resolveStatus(
        (over.data?.current as { status?: unknown } | undefined)?.status ?? null,
      );
      return dataStatus ?? resolveStatus(over.id);
    };

    return {
      screenReaderInstructions: {
        draggable:
          "Para tomar un elemento, presiona espacio o enter. Usa las flechas para moverte entre columnas y vuelve a presionar espacio o enter para soltarlo.",
      },
      announcements: {
        onDragStart: ({ active }: DragStartEvent) => {
          const item = getItem(active.id);
          if (!item) {
            return undefined;
          }

          const columnTitle = describeColumn(item.status);
          const itemTitle = getItemTitle(item);
          return columnTitle
            ? `Tomaste ${itemTitle}. Columna actual ${columnTitle}.`
            : `Tomaste ${itemTitle}.`;
        },
        onDragOver: ({ active, over }: DragOverEvent) => {
          if (!over) {
            return undefined;
          }

          const item = getItem(active.id);
          if (!item) {
            return undefined;
          }

          const status = resolveFromOver(over);
          const columnTitle = describeColumn(status);
          const itemTitle = getItemTitle(item);
          return columnTitle ? `${itemTitle} está sobre la columna ${columnTitle}.` : undefined;
        },
        onDragEnd: ({ active, over }: DragEndEvent) => {
          const item = getItem(active.id);
          if (!item) {
            return undefined;
          }

          if (!over) {
            return `${getItemTitle(item)} se soltó fuera de cualquier columna.`;
          }

          const status = resolveFromOver(over);
          const columnTitle = describeColumn(status);
          const itemTitle = getItemTitle(item);
          return columnTitle
            ? `${itemTitle} se colocó en la columna ${columnTitle}.`
            : `${itemTitle} se soltó, pero la columna de destino es desconocida.`;
        },
        onDragCancel: ({ active }: DragCancelEvent) => {
          const item = getItem(active.id);
          return item ? `Se canceló el movimiento de ${getItemTitle(item)}.` : undefined;
        },
      },
    };
  }, [describeColumn, getItemTitle, itemLookup, resolveStatus]);

  const mobileContent = useMemo(() => {
    if (!hasStatuses) {
      return emptyStatusesContent;
    }

    const renderList = (list: TItem[]) =>
      list.length === 0 ? (
        <EmptyPlaceholder message={emptyColumnMessage} />
      ) : (
        <div className="space-y-4">
          {list.map((item) => {
            const containerProps = {
              ref: noopRef,
              style: { cursor: "default" },
              "data-status": item.status,
            } as CardContainerProps;

            return (
              <div key={item.id}>
                {renderCard({
                  item,
                  isActive: false,
                  isDragging: false,
                  containerProps,
                  dragHandleProps: {},
                  showDragHandle: false,
                  onMoveStatus: (status) => onMoveStatus(item, status),
                })}
              </div>
            );
          })}
        </div>
      );

    return (
      <Tabs defaultValue={statuses[0]}>
        <TabsList className="grid w-full grid-cols-3 rounded-md bg-neutral-50 p-0.5">
          {statuses.map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="h-8 truncate rounded-md px-2 text-[12px] leading-4 whitespace-nowrap data-[state=active]:bg-yellow-200 data-[state=active]:text-[#1C2431]"
            >
              {statusTitles[status]} ({buckets[status].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {statuses.map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {renderList(buckets[status])}
          </TabsContent>
        ))}
      </Tabs>
    );
  }, [
    buckets,
    emptyColumnMessage,
    emptyStatusesContent,
    hasStatuses,
    onMoveStatus,
    renderCard,
    statusTitles,
    statuses,
  ]);

  if (!hasStatuses) {
    return emptyStatusesContent;
  }

  if (isMobile) {
    return mobileContent;
  }

  return (
    <DndContext
      accessibility={accessibility}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="-mx-2 overflow-x-auto overscroll-x-contain pb-1.5 md:mx-0">
        <div className="flex snap-x snap-mandatory gap-3 px-2 md:grid md:grid-cols-2 md:gap-5 md:px-0 xl:grid-cols-3">
          {statuses.map((status) => (
            <div key={status} className="min-w-[280px] snap-start sm:min-w-[340px] md:min-w-0">
              <KanbanColumn
                title={statusTitles[status]}
                status={status}
                items={buckets[status]}
                activeId={activeId}
                isUpdating={isUpdating}
                emptyColumnMessage={emptyColumnMessage}
                renderCard={renderCard}
                onMoveStatus={onMoveStatus}
              />
            </div>
          ))}
        </div>
      </div>
      <DragOverlay>{activeItem && renderPreview ? renderPreview(activeItem) : null}</DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
