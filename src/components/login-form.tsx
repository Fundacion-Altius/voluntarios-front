"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingButton from "./loading-button";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleOAuthLogin = async (provider: "google" | "microsoft") => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/auth/oauth/${provider}/url`);
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("OAuth error:", error);
    } finally {
      setLoading(false);
    }
  };
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    const result = await login(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push("/dashboard"); // Client-side navigation
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" name="password" required />
              </div>
              <div className="flex flex-col gap-3">
                <LoadingButton
                  isLoading={loading}
                  type="submit"
                  className="w-full"
                >
                  Login
                </LoadingButton>
                {/*  <Button variant="outline" className="w-full">
                  Login with Google
                </Button> */}
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
            {error && <p>{error}</p>}
          </form>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3">
        <Button onClick={() => handleOAuthLogin("google")} disabled={loading}>
          Continue with Google
        </Button>
        <Button
          onClick={() => handleOAuthLogin("microsoft")}
          disabled={loading}
        >
          Continue with Microsoft
        </Button>
      </div>
    </div>
  );
}
