import Link from "next/link";
import { cookies } from "next/headers";

import Footer from "@/components/e/Footer";
import Header from "@/components/e/Header";
import { Button } from "@/components/ui/button";
import { verifyAccessToken } from "@/app/lib/jwt";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

type ClientListItem = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
};

type CurrentUserProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

const clientListSelect = "id, full_name, email, avatar_url, created_at";

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

async function getClients() {
  const db = getDatabaseClient();
  const { data: clients, error } = await db
    .from("profiles")
    .select(clientListSelect)
    .eq("role", "client")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return [];
  }

  return (clients ?? []) as ClientListItem[];
}

async function getCurrentUserProfile(userId: string | null) {
  if (!userId) {
    return null;
  }

  const db = getDatabaseClient();
  const { data: user, error } = await db
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user as CurrentUserProfile;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMemberSince(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ClientePage() {
  const authenticatedUserId = await getAuthenticatedUserId();
  const [clients, currentUser] = await Promise.all([
    getClients(),
    getCurrentUserProfile(authenticatedUserId),
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#eff5f4_42%,_#dee4e3_100%)] text-text-main">
      <Header />

      <main>
        <section className="relative overflow-hidden px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-brand-peach/35 blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-brand-navy-soft/15 blur-3xl" />

          <div className="relative mx-auto max-w-7xl">
            <div className="rounded-[2rem] border border-white/70 bg-white/55 p-8 shadow-[0_24px_80px_rgba(4,22,39,0.08)] backdrop-blur sm:p-10 lg:p-12">
              <span className="inline-flex bg-brand-peach px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-brown">
                Diretório de clientes
              </span>
              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.05em] text-brand-navy sm:text-6xl lg:text-7xl">
                Perfis públicos da comunidade
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-9 text-text-muted sm:text-xl">
                Visitantes conseguem navegar pelos perfis públicos. Usuários
                autenticados acessam o próprio perfil com edição liberada.
                Telefones continuam privados para terceiros.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-12 sm:px-10 lg:px-14 lg:pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <h2 className="text-3xl font-black tracking-[-0.04em] text-brand-navy">
                Todos os clientes
              </h2>
              <p className="mt-2 text-base text-text-muted">
                {clients.length} perfis disponíveis para visualização.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {clients.map((client) => {
                const isCurrentUser = currentUser?.id === client.id;
                const initials = getInitials(client.full_name);

                return (
                  <article
                    key={client.id}
                    className="group rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_20px_70px_rgba(4,22,39,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_90px_rgba(4,22,39,0.12)]"
                  >
                    <div className="flex items-start gap-4">
                      {client.avatar_url ? (
                        <img
                          src={client.avatar_url}
                          alt={client.full_name}
                          className="h-20 w-20 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#dee4e3_0%,#cbd5e1_48%,#94a3b8_100%)] text-xl font-black text-brand-navy">
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-surface-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-steel-mid">
                            Cliente
                          </span>
                          {isCurrentUser ? (
                            <span className="bg-brand-peach px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-brown">
                              Seu perfil
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-4 truncate text-2xl font-black tracking-[-0.04em] text-brand-navy">
                          {client.full_name}
                        </h3>

                        <p className="mt-2 truncate text-base text-text-muted">
                          {client.email}
                        </p>

                        <p className="mt-4 text-sm font-medium text-text-subtle">
                          Conta criada em {formatMemberSince(client.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button
                        asChild
                        variant="brand"
                        size="lg"
                        className="w-full rounded-2xl uppercase tracking-[0.18em]"
                      >
                        <Link href={`/cliente/${client.id}`}>
                          {isCurrentUser ? "Abrir Meu Perfil" : "Ver Perfil"}
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
