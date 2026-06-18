"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";

import Header from "@/components/e/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  error?: string;
  user?: {
    role: "admin";
  };
};

export default function AdminLoginPage() {
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
      const response = await fetch("/api/auth/login/admin", {
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

      if (!response.ok || !data.user) {
        setErrorMessage(data.error ?? "Não foi possível fazer login admin.");
        return;
      }

      router.replace("/admin");
      router.refresh();
      window.location.href = "/admin";
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-acode-mist">
      <Header />

      <main className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
          <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_-45px_rgba(4,22,39,0.35)] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="hidden bg-[linear-gradient(180deg,#041627_0%,#12293f_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-brand-peach px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-brown">
                  Super admin
                </div>
                <h1 className="mt-6 text-4xl font-black tracking-[-0.05em]">
                  Controle operacional da plataforma
                </h1>
                <p className="mt-4 text-base leading-8 text-white/70">
                  Acesse um painel direto para editar e remover clientes,
                  prestadores e serviços.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/50">
                  Acesso restrito
                </p>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Esta entrada é apenas para administradores.
                </p>
              </div>
            </div>

            <div className="flex items-center px-6 py-10 sm:px-10 lg:px-12">
              <div className="mx-auto w-full max-w-md">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-navy/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-navy">
                    <Shield className="size-3.5" />
                    Login admin
                  </div>
                  <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-brand-navy">
                    Entrar no painel
                  </h2>
                  <p className="mt-3 text-base leading-8 text-text-muted">
                    Use o email e a senha do usuário admin cadastrado
                    diretamente no banco.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@empresa.com"
                      className="h-14 rounded-2xl border-border/70 bg-surface-muted px-5"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                      Senha
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Digite sua senha"
                        className="h-14 rounded-2xl border-border/70 bg-surface-muted px-5 pr-16"
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
                    {isSubmitting ? "Entrando..." : "Acessar painel admin"}
                  </Button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
