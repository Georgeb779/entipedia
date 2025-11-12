import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, LogoMark } from "@/components";
import { useAuth, useAuthActions } from "@/hooks";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ApiAuthUser } from "@/types";
import { mapApiAuthUser } from "@/utils";

const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { login } = useAuthActions();

  const { redirectPath, infoMessage } = useMemo(() => {
    const state = (location.state as { from?: string; message?: string } | null) ?? null;
    return {
      redirectPath:
        state?.from && typeof state.from === "string" && state.from.length > 0 ? state.from : "/",
      infoMessage:
        state?.message && typeof state.message === "string" && state.message.length > 0
          ? state.message
          : null,
    };
  }, [location.state]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (auth.status === "authenticated") {
      navigate(redirectPath, { replace: true });
    }
  }, [auth.status, navigate, redirectPath]);

  const onSubmit = async (values: LoginFormValues) => {
    form.clearErrors("root");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorMessage =
          response.status === 401
            ? "Correo electrónico o contraseña inválidos."
            : "No se pudo iniciar sesión. Intenta nuevamente.";
        form.setError("root", { type: "server", message: errorMessage });
        return;
      }

      const data: { user: ApiAuthUser } = await response.json();

      login(mapApiAuthUser(data.user));
      navigate(redirectPath, { replace: true });
    } catch {
      form.setError("root", {
        type: "server",
        message: "No se pudo iniciar sesión. Intenta nuevamente.",
      });
    }
  };

  return (
    <div className="text-foreground flex min-h-screen items-center justify-center bg-linear-to-b from-[#fdfcf9] via-[#f8f1e6] to-[#f3e6d4] px-4 py-16">
      <div className="border-border/30 w-full max-w-md space-y-10 rounded-[2.25rem] border bg-white/90 p-10 shadow-[0_32px_80px_rgba(34,31,27,0.08)] backdrop-blur">
        <div className="space-y-4 text-center">
          <LogoMark size="md" className="mx-auto" />
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-muted-foreground text-sm">
              Inicia sesión para continuar donde lo dejaste.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      autoComplete="current-password"
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
              aria-label={form.formState.isSubmitting ? "Iniciando sesión" : "Iniciar sesión"}
              role="button"
            >
              {form.formState.isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </Form>

        <div className="space-y-3">
          {infoMessage ? (
            <div className="bg-secondary/30 text-secondary-foreground rounded-xl px-4 py-3 text-sm font-medium">
              {infoMessage}
            </div>
          ) : null}

          <div className="text-muted-foreground space-y-1 text-center text-sm">
            <p>
              ¿Necesitas una cuenta?{" "}
              <Link
                to="/auth/register"
                className="text-primary hover:text-primary/80 hover:underline"
              >
                Crear una
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
    </div>
  );
};

export default Login;
