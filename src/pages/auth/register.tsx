import { useState } from "react";
import { Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, LogoMark } from "@/components";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(100, "El nombre debe tener 100 caracteres o menos."),
    email: z.string().trim().email("Ingresa un correo electrónico válido."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .regex(/[A-Za-z]/, "La contraseña debe incluir letras.")
      .regex(/[0-9]/, "La contraseña debe incluir números."),
    confirmPassword: z.string().min(8, "La confirmación debe tener al menos 8 caracteres."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas deben coincidir.",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    form.clearErrors("root");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const errorMessage =
          response.status === 409
            ? "Ya existe una cuenta con este correo electrónico."
            : "No se pudo crear la cuenta. Intenta nuevamente.";

        form.setError("root", {
          type: "server",
          message: errorMessage,
        });
        return;
      }

      setRegistrationComplete(true);
    } catch {
      form.setError("root", {
        type: "server",
        message: "No se pudo crear la cuenta. Intenta nuevamente.",
      });
    }
  };

  if (registrationComplete) {
    return (
      <div className="text-foreground flex min-h-screen items-center justify-center bg-linear-to-b from-[#fdfcf9] via-[#f8f1e6] to-[#f3e6d4] px-4 py-16">
        <div className="border-border/30 w-full max-w-md rounded-[2.25rem] border bg-white/90 p-4 shadow-[0_32px_80px_rgba(34,31,27,0.08)] backdrop-blur md:space-y-10 md:p-10">
          <div className="space-y-4 text-center">
            <LogoMark size="md" className="mx-auto" />
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight">¡Cuenta creada!</h1>
              <p className="text-muted-foreground text-sm">
                Tu cuenta está lista. Ahora puedes iniciar sesión con tus credenciales para comenzar
                a usar Entipedia.
              </p>
            </div>
          </div>

          <div className="text-muted-foreground space-y-1 text-center text-sm">
            <Link to="/auth/login" className="text-primary hover:text-primary/80 hover:underline">
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-foreground flex min-h-screen items-center justify-center bg-linear-to-b from-[#fdfcf9] via-[#f8f1e6] to-[#f3e6d4] px-4 py-16">
      <div className="border-border/30 w-full max-w-md rounded-[2.25rem] border bg-white/90 p-4 shadow-[0_32px_80px_rgba(34,31,27,0.08)] backdrop-blur md:space-y-10 md:p-10">
        <div className="space-y-4 text-center">
          <LogoMark size="md" className="mx-auto" />
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
            <p className="text-muted-foreground text-sm">
              Únete a Entipedia para gestionar tus proyectos y tareas.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ada Lovelace"
                      autoComplete="name"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@ejemplo.com"
                      autoComplete="email"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-destructive text-sm font-medium" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
              aria-label={form.formState.isSubmitting ? "Creando cuenta" : "Crear cuenta"}
              role="button"
            >
              {form.formState.isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
        </Form>

        <div className="text-muted-foreground space-y-1 text-center text-sm">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link to="/auth/login" className="text-primary hover:text-primary/80 hover:underline">
              Inicia sesión
            </Link>
          </p>
          <p>
            <Link to="/" className="text-primary hover:text-primary/80 hover:underline">
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
