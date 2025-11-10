import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/utils";

const Form = FormProvider;

const FormFieldContext = React.createContext<{ name: string } | null>(null);

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ControllerProps<TFieldValues, TName>,
) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};
FormField.displayName = "FormField";

const FormItemContext = React.createContext<{ id: string } | null>(null);

export const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = fieldContext
    ? getFieldState(fieldContext.name as never, formState)
    : { invalid: false, isDirty: false, isTouched: false, error: undefined };

  const id = itemContext?.id;

  return {
    name: fieldContext?.name ?? "",
    formItemId: id,
    formDescriptionId: id ? `${id}-description` : undefined,
    formMessageId: id ? `${id}-message` : undefined,
    ...fieldState,
  };
};

export const FormLabel = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { formItemId, name, invalid } = useFormField();

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(invalid && "text-destructive", className)}
      htmlFor={formItemId ?? name}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

export const FormControl = React.forwardRef<
  React.ComponentRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId, invalid } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={[formDescriptionId, formMessageId].filter(Boolean).join(" ") || undefined}
      aria-invalid={invalid ? "true" : undefined}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { formMessageId, error } = useFormField();
  const body = error ? String(error.message ?? error.type) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-destructive text-sm font-medium", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export { Form };
