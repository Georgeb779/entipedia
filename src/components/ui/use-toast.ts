import { type ReactNode, useEffect, useState } from "react";

import type { ToastActionElement, ToastProps } from "./toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000;

type ToasterToast = ToastProps & {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
};

type ToastState = {
  toasts: ToasterToast[];
};

type ToastAction =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const reducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST": {
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    }

    case "UPDATE_TOAST": {
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
        ),
      };
    }

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === toastId || toastId === undefined ? { ...toast, open: false } : toast,
        ),
      };
    }

    case "REMOVE_TOAST": {
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }

      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      };
    }

    default:
      return state;
  }
};

const listeners = new Set<(state: ToastState) => void>();

let memoryState: ToastState = { toasts: [] };

const dispatch = (action: ToastAction) => {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
};

interface ToastOptions extends Omit<ToasterToast, "id"> {
  id?: string;
}

const useToast = () => {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, [setState]);

  return {
    ...state,
    toast: ({ ...props }: ToastOptions) => {
      const id = props.id ?? crypto.randomUUID();

      const update = (toast: ToastOptions) =>
        dispatch({ type: "UPDATE_TOAST", toast: { ...toast, id } });

      const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

      dispatch({
        type: "ADD_TOAST",
        toast: {
          ...props,
          id,
          open: true,
        },
      });

      return {
        id,
        dismiss,
        update,
      };
    },
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
};

const toast = (props: ToastOptions) => {
  const id = props.id ?? crypto.randomUUID();

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
    },
  });

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    update: (toastProps: ToastOptions) =>
      dispatch({ type: "UPDATE_TOAST", toast: { ...toastProps, id } }),
  };
};

export { toast, useToast };
export type { ToasterToast, ToastOptions };
