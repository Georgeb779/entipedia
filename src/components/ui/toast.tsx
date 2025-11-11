import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { type VariantProps, cva } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed inset-x-0 top-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-auto sm:right-0 sm:flex-col",
      "sm:bottom-0 sm:w-full sm:max-w-sm sm:p-6",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border px-4 py-3 text-sm shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-neutral-200/80 bg-white text-neutral-900",
        destructive: "border-red-200/70 bg-red-600 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants> & {
    className?: string;
  };

const Toast = React.forwardRef<React.ComponentRef<typeof ToastPrimitives.Root>, ToastProps>(
  ({ className, variant, ...props }, ref) => (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        toastVariants({ variant }),
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
        "data-[state=open]:slide-in-from-bottom-full sm:[data-state=open]:slide-in-from-right-full",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition data-[swipe=end]:translate-x-[--radix-toast-swipe-end-x]",
        "data-[swipe=move]:translate-x-[--radix-toast-swipe-move-x]",
        className,
      )}
      {...props}
    />
  ),
);
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
      "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none",
      "disabled:pointer-events-none disabled:opacity-50",
      "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute top-3 right-3 rounded-md p-1 text-neutral-500 transition hover:text-neutral-900",
      "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none",
      className,
    )}
    data-toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold text-neutral-900", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-xs text-neutral-600", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
export type { ToastActionElement, ToastProps };
