import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";

type ViewModeResolver<T extends string> = (value: string | null | undefined) => T;

type PersistentViewModeOptions<T extends string> = {
  storageKey: string;
  paramName: string;
  resolve: ViewModeResolver<T>;
  serialize?: (value: T) => string;
};

const isBrowser = typeof window !== "undefined";

const readPersistedValue = <T extends string>(
  key: string,
  resolve: ViewModeResolver<T>,
): T | null => {
  if (!isBrowser) {
    return null;
  }

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return null;
  }

  return resolve(stored);
};

const writePersistedValue = <T extends string>(key: string, value: T) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Best effort persistence only.
  }
};

export function usePersistentViewMode<T extends string>({
  storageKey,
  paramName,
  resolve,
  serialize,
}: PersistentViewModeOptions<T>): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultValue = useMemo(() => resolve(null), [resolve]);
  const serializer = useCallback((value: T) => (serialize ? serialize(value) : value), [serialize]);

  const view = useMemo<T>(() => {
    const rawParam = searchParams.get(paramName);
    if (rawParam !== null) {
      return resolve(rawParam);
    }

    const stored = readPersistedValue(storageKey, resolve);
    if (stored) {
      return stored;
    }

    return defaultValue;
  }, [searchParams, paramName, resolve, storageKey, defaultValue]);

  useEffect(() => {
    writePersistedValue(storageKey, view);
  }, [storageKey, view]);

  useEffect(() => {
    const rawParam = searchParams.get(paramName);
    const serialized = serializer(view);

    if (view === defaultValue) {
      if (rawParam !== null) {
        const next = new URLSearchParams(searchParams);
        next.delete(paramName);
        setSearchParams(next, { replace: true });
      }
      return;
    }

    if (rawParam !== serialized) {
      const next = new URLSearchParams(searchParams);
      next.set(paramName, serialized);
      setSearchParams(next, { replace: true });
    }
  }, [defaultValue, paramName, searchParams, serializer, setSearchParams, view]);

  const setView = useCallback(
    (value: T) => {
      const serialized = serializer(value);
      const next = new URLSearchParams(searchParams);

      if (value === defaultValue) {
        next.delete(paramName);
      } else {
        next.set(paramName, serialized);
      }

      setSearchParams(next, { replace: true });
    },
    [defaultValue, paramName, searchParams, serializer, setSearchParams],
  );

  return [view, setView];
}
