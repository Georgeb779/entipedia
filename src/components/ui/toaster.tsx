import { type JSX } from "react";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { useToast } from "./use-toast";

const Toaster = (): JSX.Element => {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, action, description, title, ...toast }) => {
        const hasTitleOrDescription = title || description;
        return (
          <Toast key={id} {...toast}>
            {hasTitleOrDescription && (
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            )}
            {action ?? null}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
};

export { Toaster };
