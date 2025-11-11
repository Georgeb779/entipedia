import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
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

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long.")
      .max(100, "Name must be at most 100 characters."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Za-z]/, "Password must include letters.")
      .regex(/[0-9]/, "Password must include numbers."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { login } = useAuthActions();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (auth.status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [auth.status, navigate]);

  const onSubmit = async (values: RegisterFormValues) => {
    form.clearErrors("root");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const errorMessage =
          response.status === 409
            ? "An account with this email already exists."
            : "Unable to create account. Please try again.";

        form.setError("root", {
          type: "server",
          message: errorMessage,
        });
        return;
      }

      const data: { user: ApiAuthUser } = await response.json();

      login(mapApiAuthUser(data.user));
      navigate("/", { replace: true });
    } catch {
      form.setError("root", {
        type: "server",
        message: "Unable to create account. Please try again.",
      });
    }
  };

  return (
    <div className="text-foreground flex min-h-screen items-center justify-center bg-linear-to-b from-[#fdfcf9] via-[#f8f1e6] to-[#f3e6d4] px-4 py-16">
      <div className="border-border/30 w-full max-w-md space-y-10 rounded-[2.25rem] border bg-white/90 p-10 shadow-[0_32px_80px_rgba(34,31,27,0.08)] backdrop-blur">
        <div className="space-y-4 text-center">
          <LogoMark size="md" className="mx-auto" />
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
            <p className="text-muted-foreground text-sm">
              Join Entipedia to manage your projects and tasks.
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
                  <FormLabel>Full name</FormLabel>
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
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
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
                  <FormLabel>Password</FormLabel>
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
                  <FormLabel>Confirm password</FormLabel>
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
              aria-label={form.formState.isSubmitting ? "Creating account" : "Create account"}
              role="button"
            >
              {form.formState.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </Form>

        <div className="text-muted-foreground space-y-1 text-center text-sm">
          <p>
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:text-primary/80 hover:underline">
              Sign in
            </Link>
          </p>
          <p>
            <Link to="/" className="text-primary hover:text-primary/80 hover:underline">
              Return home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
