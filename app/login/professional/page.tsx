"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import Header from "@/components/e/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  error?: string;
  user?: {
    role: "client" | "professional" | "admin";
  };
  professional?: {
    business_name?: string | null;
  };
};

export default function ProfessionalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login/professional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || data.user?.role !== "professional") {
        setErrorMessage(data.error || "Não foi possível fazer login.");
        return;
      }

      const businessName = data.professional?.business_name;
      const redirectPath = businessName
        ? `/prestador/${businessName}/service-management?tab=requests`
        : "/prestador";

      startTransition(() => {
        router.replace(redirectPath);
        router.refresh();
      });

      window.location.href = redirectPath;
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
          <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-surface shadow-[0_30px_90px_-45px_rgba(4,22,39,0.35)] lg:grid-cols-[1.35fr_0.95fr]">
            <div className="relative hidden min-h-[720px] overflow-hidden bg-brand-navy p-8 text-white lg:flex lg:flex-col lg:justify-between lg:p-16">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,22,39,0.52)_0%,rgba(4,22,39,0.9)_100%),repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_2px,transparent_2px,transparent_30px)]" />
              <div className="relative z-10 space-y-8">
                <div className="inline-flex rounded-full bg-brand-peach px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-brown">
                  Portal do prestador
                </div>
                <div className="max-w-xl space-y-6">
                  <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white xl:text-6xl">
                    Gerencie seus serviços com clareza e agilidade.
                  </h1>
                  <p className="max-w-lg text-xl leading-9 text-white/64">
                    Acompanhe solicitações, atualize seu perfil e mantenha seu
                    atendimento organizado.
                  </p>
                </div>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-8 text-white">
                <div className="space-y-2">
                  <p className="text-5xl font-black tracking-[-0.04em]">24h</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/48">
                    Resposta rápida
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-5xl font-black tracking-[-0.04em]">4.9/5</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/48">
                    Avaliação dos clientes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-h-[720px] items-center bg-surface px-6 py-10 sm:px-10 lg:px-16">
              <div className="mx-auto w-full max-w-md">
                <div className="mb-10 space-y-3">
                  <h2 className="text-4xl font-black tracking-[-0.04em] text-text-main">
                    Login do prestador
                  </h2>
                  <p className="text-lg text-text-muted">
                    Entre para gerenciar sua conta profissional.
                  </p>
                </div>

                <div className="mb-7 rounded-2xl border border-brand-peach bg-brand-peach/35 px-5 py-4 text-sm font-medium text-brand-brown">
                  Você é um cliente?{" "}
                  <Link
                    href="/login"
                    className="font-black text-brand-navy transition-colors hover:text-brand-orange"
                  >
                    clique aqui para entrar
                  </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">
                  <div className="space-y-3">
                    <label
                      htmlFor="email"
                      className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                    >
                      Endereço de e-mail
                    </label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nome@empresa.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                    >
                      Senha
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 pr-16 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-xl text-brand-steel-deep hover:bg-white/70 hover:text-text-main"
                        onClick={() => setShowPassword((current) => !current)}
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
                    {isSubmitting ? "Entrando..." : "Entrar como prestador"}
                  </Button>
                </form>

                <div className="mt-12 border-t border-border pt-8 text-center text-base text-text-subtle">
                  Ainda não tem conta profissional?{" "}
                  <Link
                    href="/register/professional"
                    className="font-semibold text-text-main transition-colors hover:text-brand-orange"
                  >
                    Crie agora
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
