import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components";
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
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 text-white">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Create account</h1>
          <p className="text-sm text-gray-300">Join Entipedia to manage your projects and tasks.</p>
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
              <p className="text-sm font-medium text-red-400" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              variant="secondary"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </Form>

        <div className="space-y-1 text-center text-sm text-gray-400">
          <p>
            Already have an account?{" "}
            <Link to="/auth/login" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
          <p>
            <Link to="/" className="text-blue-400 hover:underline">
              Return home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
