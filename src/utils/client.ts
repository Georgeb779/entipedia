import type { ApiClient, Client } from "@/types";

const parseDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

export const mapApiClient = (client: ApiClient): Client => ({
  ...client,
  startDate: parseDate(client.startDate),
  endDate: client.endDate ? parseDate(client.endDate) : null,
  createdAt: parseDate(client.createdAt),
  updatedAt: parseDate(client.updatedAt),
});

const currencyFormatter = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
});

export const formatCurrencyDOP = (value: number): string => {
  return currencyFormatter.format(value / 100);
};

export const parseCurrencyDOP = (value: string | number): number => {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }

  const numeric = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number.parseFloat(numeric);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
};

const displayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

export const formatClientDate = (value: Date | string | null): string => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return displayFormatter.format(date);
};

const formatDateForInput = (value: Date | string | null): string => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0] ?? "";
};

export const formatClientDateForInput = formatDateForInput;
