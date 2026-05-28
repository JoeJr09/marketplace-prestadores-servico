"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  error?: string;
  user?: {
    role: "client" | "professional" | "admin";
  };
};

function getRedirectPath(
  role: LoginResponse["user"]["role"]
) {
  if (role === "professional") {
    return "/prestador";
  }

  if (role === "admin") {
    return "/admin";
  }

  return "/cliente";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data =
        (await response.json()) as LoginResponse;

      if (!response.ok || !data.user) {
        setErrorMessage(
          data.error ||
            "Nao foi possivel fazer login."
        );
        return;
      }

      startTransition(() => {
        router.push(
          getRedirectPath(data.user.role)
        );
      });
    } catch {
      setErrorMessage(
        "Nao foi possivel conectar ao servidor."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-surface shadow-[0_30px_90px_-45px_rgba(4,22,39,0.35)] lg:grid-cols-[1.35fr_0.95fr]">
          <div className="relative hidden min-h-[720px] overflow-hidden bg-brand-navy p-8 text-white lg:flex lg:flex-col lg:justify-between lg:p-16">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,22,39,0.58)_0%,rgba(4,22,39,0.88)_100%),radial-gradient(circle_at_top_left,rgba(129,146,167,0.25),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(129,146,167,0.14),transparent_34%),linear-gradient(115deg,rgba(255,255,255,0.05)_0%,transparent_22%,transparent_100%)]" />
            <div className="absolute inset-y-0 right-[-9%] w-[54%] rounded-full bg-[linear-gradient(180deg,rgba(129,146,167,0.22)_0%,rgba(129,146,167,0.06)_100%)] blur-[2px]" />
            <div className="relative z-10 space-y-8">
              <div className="inline-flex rounded-full bg-brand-peach px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-brown">
                Client Portal
              </div>
              <div className="max-w-xl space-y-6">
                <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.05em] text-white xl:text-6xl">
                  Find the structural expertise you need.
                </h1>
                <p className="max-w-lg text-xl leading-9 text-white/64">
                  Access a curated network of professionals vetted for urban development, maintenance, and technical services.
                </p>
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-8 text-white">
              <div className="space-y-2">
                <p className="text-5xl font-black tracking-[-0.06em]">
                  12k+
                </p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/48">
                  Vetted specialists
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-black tracking-[-0.06em]">
                  4.9/5
                </p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/48">
                  Service rating
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-[720px] items-center bg-surface px-6 py-10 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-10 space-y-3">
                <h2 className="text-4xl font-black tracking-[-0.04em] text-text-main">
                  Welcome Back
                </h2>
                <p className="text-lg text-text-muted">
                  Log in to manage your service requests
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-7"
              >
                <div className="space-y-3">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-bold uppercase tracking-[0.24em] text-brand-orange"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 pr-16 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-xl text-brand-steel-deep hover:bg-white/70 hover:text-text-main"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl border border-[#ffd3c4] bg-[#fff3ef] px-4 py-3 text-sm font-medium text-[#8a3b18]">
                    {errorMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  variant="brand"
                  size="xl"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Logging in..."
                    : "Log In to Acode Aqui"}
                </Button>
              </form>

              <div className="mt-12 border-t border-border pt-8 text-center text-base text-text-subtle">
                Don&apos;t have a client account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-text-main transition-colors hover:text-brand-orange"
                >
                  Create one now
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
