import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import Footer from "@/components/e/Footer";
import Header from "@/components/e/Header";
import LogoutButton from "@/components/e/LogoutButton";
import { Button } from "@/components/ui/button";
import { verifyAccessToken } from "@/app/lib/jwt";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

const clientSelect = "id, full_name, email, phone, avatar_url, bio, created_at";

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyAccessToken(token).id;
  } catch {
    return null;
  }
}

async function getClientProfile(id: string) {
  const db = getDatabaseClient();
  const { data: client, error } = await db
    .from("profiles")
    .select(clientSelect)
    .eq("id", id)
    .eq("role", "client")
    .single();

  if (error || !client) {
    return null;
  }

  return client as ClientProfile;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatCreatedAt(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatMemberSince(date: string) {
  const now = new Date();
  const createdAt = new Date(date);
  const diffInMonths =
    (now.getFullYear() - createdAt.getFullYear()) * 12 +
    (now.getMonth() - createdAt.getMonth());

  if (diffInMonths <= 0) return "Novo por aqui";
  if (diffInMonths === 1) return "Membro há 1 mês";
  if (diffInMonths < 12) return `Membro há ${diffInMonths} meses`;

  const years = Math.floor(diffInMonths / 12);
  if (years === 1) return "Membro há 1 ano";
  return `Membro há ${years} anos`;
}

export default async function ClienteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authenticatedUserId = await getAuthenticatedUserId();
  const client = await getClientProfile(id);

  if (!client) {
    notFound();
  }

  const isOwner = authenticatedUserId === client.id;
  const initials = getInitials(client.full_name);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#eff5f4_42%,_#dee4e3_100%)] text-text-main">
      <Header />

      <main>
        <section className="relative overflow-hidden px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,rgba(4,22,39,0.08),rgba(255,220,195,0.22),rgba(239,245,244,0))]" />
          <div className="absolute -left-20 top-16 h-44 w-44 rounded-full bg-brand-peach/35 blur-3xl" />
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-brand-navy-soft/15 blur-3xl" />

          <div className="relative mx-auto mb-8 flex max-w-7xl justify-end">
            {isOwner ? <LogoutButton accountType="client" /> : null}
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.5fr)_380px] lg:items-start">
            <div className="rounded-[2rem] border border-white/70 bg-white/55 p-8 shadow-[0_24px_80px_rgba(4,22,39,0.08)] backdrop-blur sm:p-10 lg:p-12">
            <div className="inline-flex items-center gap-3">
              <span className="bg-brand-peach px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-brown">
                Perfil de cliente
              </span>
              <span className="text-sm font-medium text-text-muted">
                {formatMemberSince(client.created_at)}
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.05em] text-brand-navy sm:text-6xl lg:text-7xl">
              {client.full_name}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-9 text-text-muted sm:text-xl break-words whitespace-pre-wrap">
              {client.bio ?? "Cliente cadastrado no marketplace com contato centralizado para acompanhamento de serviços, solicitações e histórico de relacionamento."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="border-l-4 border-brand-navy bg-surface-muted px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-steel-mid">
                Email validado
              </span>
              <span className="border-l-4 border-brand-navy bg-surface-muted px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-steel-mid">
                Conta criada em{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(client.created_at))}
              </span>
              {isOwner && client.phone ? (
                <span className="border-l-4 border-brand-navy bg-surface-muted px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-steel-mid">
                  Telefone privado disponível
                </span>
              ) : null}
            </div>
          </div>

          <aside className="space-y-7">
            <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(4,22,39,0.08)] backdrop-blur">
              {client.avatar_url ? (
                <img
                  src={client.avatar_url}
                  alt={client.full_name}
                  className="h-[360px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[360px] items-center justify-center bg-[linear-gradient(160deg,#dee4e3_0%,#cbd5e1_48%,#94a3b8_100%)]">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/60 bg-white/70 text-4xl font-black tracking-[-0.05em] text-brand-navy shadow-lg">
                    {initials}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] bg-brand-steel-mid p-8 text-white shadow-[0_24px_80px_rgba(4,22,39,0.18)]">
              <h2 className="text-3xl font-black tracking-[-0.04em]">
                Informações de contato
              </h2>
              <p className="mt-3 text-base text-white/70">
                Dados principais para exibição no frontend.
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                    Email
                  </p>
                  <p className="mt-2 break-all text-lg font-semibold">
                    {client.email}
                  </p>
                </div>

                {isOwner ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                      Telefone
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {client.phone ?? "Telefone não informado"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-6 pb-12 sm:px-10 lg:px-14 lg:pb-16">
        <div className="mx-auto max-w-7xl">
          <article className="rounded-[2rem] border border-white/70 bg-white/60 p-8 shadow-[0_20px_70px_rgba(4,22,39,0.08)] backdrop-blur sm:p-10">
            <div className="flex items-center gap-4">
              <h2 className="text-4xl font-black tracking-[-0.04em] text-brand-navy">
                Sobre a conta
              </h2>
              <div className="h-px flex-1 bg-border-soft" />
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border bg-surface-plain p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                  Nome completo
                </p>
                <p className="mt-3 text-xl font-bold text-brand-navy">
                  {client.full_name}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-surface-plain p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                  Cliente desde
                </p>
                <p className="mt-3 text-xl font-bold text-brand-navy">
                  {formatCreatedAt(client.created_at)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-surface-plain p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                  Email principal
                </p>
                <p className="mt-3 break-all text-xl font-bold text-brand-navy">
                  {client.email}
                </p>
              </div>

              {client.bio ? (
                <div className="rounded-[1.5rem] border border-border bg-surface-plain p-5 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                    Sobre mim
                  </p>
                  <p className="mt-3 max-w-full whitespace-pre-wrap break-words text-lg leading-8 text-text-muted [overflow-wrap:anywhere]">
                    {client.bio}
                  </p>
                </div>
              ) : isOwner ? (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-surface-plain p-5 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                    Sobre mim
                  </p>
                  <p className="mt-3 text-base text-text-subtle italic">
                    Você ainda não adicionou uma bio. Edite seu perfil para contar um pouco sobre você.
                  </p>
                </div>
              ) : null}
            </div>

            {isOwner ? (
              <div className="mt-6">
                <Button
                  asChild
                  variant="brand"
                  size="lg"
                  className="rounded-2xl uppercase tracking-[0.18em]"
                >
                  <Link href={`/cliente/${client.id}/edit`}>Editar perfil</Link>
                </Button>
              </div>
            ) : null}
          </article>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
