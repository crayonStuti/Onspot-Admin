"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginUser } from "@/lib/actions";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
  rememberMe: z.boolean(),
});

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      router.replace('/crm/dashboard');
    }
  }, [router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await loginUser({
        email: values.email,
        password: values.password,
      });

      if (response.user.role !== 'admin') {
        toast.error('Access denied. Only admin users can access this system.');
        setLoading(false);
        return;
      }

      localStorage.setItem('authToken', response.idToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('isLoggedIn', 'true');

      const expires = new Date();
      expires.setDate(expires.getDate() + 1);
      document.cookie = `auth-token=${response.idToken}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;

      toast.success('Login successful');
      router.push('/crm/dashboard');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Login failed');
      console.error("Login error:", err.message);

      const errorMessage = err.message.includes('Access denied')
        ? 'Access denied. Only admin users can access this system.'
        : 'Invalid credentials';

      toast.error(errorMessage);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
        <div className="w-full max-w-[500px] flex-col justify-center rounded-xl bg-card border border-border p-8 shadow-sm md:p-10">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Your email" {...field} className="h-11" />
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-semibold">Password</FormLabel>
                      <Link
                        href="#"
                        className="text-sm font-semibold text-muted-foreground hover:text-primary"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Your password"
                          className="h-11 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              

              <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold min-w-0">
                <span className="inline-block w-[100px]">{loading ? "Signing in..." : "Continue"}</span>
              </Button>

              <Button type="button" variant="outline" onClick={() => { }} className="w-full h-11 font-semibold">
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4b"></path>
                </svg>
                Sign in with Google
              </Button>

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
