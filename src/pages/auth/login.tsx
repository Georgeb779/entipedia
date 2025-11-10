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

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { login } = useAuthActions();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (auth.status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [auth.status, navigate]);

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
            ? "Invalid email or password."
            : "Unable to login. Please try again.";
        form.setError("root", { type: "server", message: errorMessage });
        return;
      }

      const data: { user: ApiAuthUser } = await response.json();

      login(mapApiAuthUser(data.user));
      navigate("/", { replace: true });
    } catch {
      form.setError("root", {
        type: "server",
        message: "Unable to login. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 text-white">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="text-sm text-gray-300">Sign in to continue where you left off.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>

        <div className="space-y-1 text-center text-sm text-gray-400">
          <p>
            Need an account?{" "}
            <Link to="/auth/register" className="text-blue-400 hover:underline">
              Create one
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

export default Login;
