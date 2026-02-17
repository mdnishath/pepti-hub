"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError, isLoading, clearError, isAuthenticated, _hasHydrated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect to appropriate dashboard if already logged in
  useEffect(() => {
    if (!_hasHydrated) {
      console.log("🔵 Login: Waiting for hydration...");
      return;
    }

    if (isAuthenticated) {
      const { user } = useAuthStore.getState();
      const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
      const redirectPath = isAdmin ? "/admin/dashboard" : "/account/dashboard";

      console.log("🔵 Login: Already authenticated, redirecting to", redirectPath);
      router.push(redirectPath);
    }
  }, [isAuthenticated, _hasHydrated, router]);

  // Don't show login form if user is authenticated or still hydrating
  if (!_hasHydrated || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🔵 Frontend: Login form submit triggered");

    clearError();

    console.log("🔵 Frontend: Calling login with:", { email });

    try {
      const success = await login(email, password);

      console.log("🔵 Frontend: Login returned:", success);

      if (success) {
        // Get user data from store to determine redirect path
        const { user } = useAuthStore.getState();
        const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
        const redirectPath = isAdmin ? "/admin/dashboard" : "/account/dashboard";

        console.log("🔵 Frontend: Success! Redirecting to", redirectPath);
        toast.success("Login successful! Redirecting...");
        router.push(redirectPath);
      } else {
        console.log("🔵 Frontend: Login failed");
        toast.error(authError || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("🔵 Frontend: Exception during login:", err);
      toast.error("An error occurred during login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} method="POST" action="#">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              onClick={(e) => {
                console.log("🔵 Frontend: Login button clicked");
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-sm text-center text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </div>

            <div className="text-xs text-center text-gray-500">
              <Link href="/" className="hover:underline">
                Back to Home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
