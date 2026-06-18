import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  MapPin,
  ReceiptText,
  XCircle,
} from "lucide-react";

import { verifyAccessToken } from "@/app/lib/jwt";
import { getProfessionalSlug } from "@/app/lib/professional-slug";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";
import Footer from "@/components/e/Footer";
import Header from "@/components/e/Header";

type AuthenticatedProfile = {
  id: string;
  role: string;
  full_name: string | null;
};

type ClientRequestStatus =
  | "PENDENTE"
  | "ACEITA"
  | "RECUSADA"
  | "CONCLUIDA"
  | "ABORTADA";

type ClientRequestRecord = {
  id: string;
  created_at: string;
  date_service: string;
  status: string;
  id_professional: string;
  id_service: string | null;
};

type ProfessionalLookup = {
  id: string;
  business_name: string | null;
  city: string | null;
  country: string | null;
  profiles:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[];
};

type ServiceLookup = {
  id: string;
  title: string | null;
  categories:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

type ClientOrderCard = {
  id: string;
  created_at: string;
  date_service: string;
  status: ClientRequestStatus;
  professional_name: string;
  professional_slug: string | null;
  location: string | null;
  service_title: string | null;
  service_category_name: string | null;
};

const allowedStatuses = new Set<ClientRequestStatus>([
  "PENDENTE",
  "ACEITA",
  "RECUSADA",
  "CONCLUIDA",
  "ABORTADA",
]);

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getAuthenticatedProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const db = getDatabaseClient();
    const { data, error } = await db
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", payload.id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AuthenticatedProfile;
  } catch {
    return null;
  }
}

async function getClientOrders(clientId: string) {
  const db = getDatabaseClient();
  const { data: requests, error: requestsError } = await db
    .from("calendar")
    .select("id, created_at, date_service, status, id_professional, id_service")
    .eq("id_cliente", clientId)
    .order("created_at", {
      ascending: false,
    });

  if (requestsError || !requests) {
    return [];
  }

  const professionalIds = Array.from(
    new Set(
      requests
        .map((request) => request.id_professional)
        .filter(
          (professionalId): professionalId is string =>
            typeof professionalId === "string",
        ),
    ),
  );

  const serviceIds = Array.from(
    new Set(
      requests
        .map((request) => request.id_service)
        .filter((serviceId): serviceId is string => typeof serviceId === "string"),
    ),
  );

  const professionalsById = new Map<string, ProfessionalLookup>();
  const servicesById = new Map<
    string,
    {
      title: string | null;
      categoryName: string | null;
    }
  >();

  if (professionalIds.length > 0) {
    const { data: professionals, error: professionalsError } = await db
      .from("professionals")
      .select("id, business_name, city, country, profiles!inner(full_name)")
      .in("id", professionalIds);

    if (!professionalsError && professionals) {
      (professionals as ProfessionalLookup[]).forEach((professional) => {
        professionalsById.set(professional.id, professional);
      });
    }
  }

  if (serviceIds.length > 0) {
    const { data: services, error: servicesError } = await db
      .from("services")
      .select("id, title, categories(name)")
      .in("id", serviceIds);

    if (!servicesError && services) {
      (services as ServiceLookup[]).forEach((service) => {
        const category = Array.isArray(service.categories)
          ? service.categories[0]
          : service.categories;

        servicesById.set(service.id, {
          title: service.title ?? null,
          categoryName: category?.name ?? null,
        });
      });
    }
  }

  return (requests as ClientRequestRecord[]).map((request) => {
    const professional = professionalsById.get(request.id_professional);
    const profile = Array.isArray(professional?.profiles)
      ? professional?.profiles[0]
      : professional?.profiles;
    const service = request.id_service
      ? servicesById.get(request.id_service)
      : null;
    const status = allowedStatuses.has(request.status as ClientRequestStatus)
      ? (request.status as ClientRequestStatus)
      : "PENDENTE";
    const professionalName =
      professional?.business_name ?? profile?.full_name ?? "Prestador";

    return {
      id: request.id,
      created_at: request.created_at,
      date_service: request.date_service,
      status,
      professional_name: professionalName,
      professional_slug: professional?.business_name
        ? getProfessionalSlug({
            business_name: professional.business_name,
          })
        : null,
      location:
        [professional?.city, professional?.country].filter(Boolean).join(", ") ||
        null,
      service_title: service?.title ?? null,
      service_category_name: service?.categoryName ?? null,
    } satisfies ClientOrderCard;
  });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: ClientRequestStatus) {
  if (status === "ACEITA") {
    return "Aceita";
  }

  if (status === "RECUSADA") {
    return "Recusada";
  }

  if (status === "CONCLUIDA") {
    return "Concluida";
  }

  if (status === "ABORTADA") {
    return "Abortada";
  }

  return "Pendente";
}

function getStatusClasses(status: ClientRequestStatus) {
  if (status === "ACEITA") {
    return "bg-brand-peach text-brand-brown";
  }

  if (status === "RECUSADA") {
    return "bg-brand-orange/12 text-brand-orange";
  }

  if (status === "CONCLUIDA") {
    return "bg-brand-navy text-white";
  }

  if (status === "ABORTADA") {
    return "bg-brand-steel-mid text-white";
  }

  return "bg-brand-navy text-white";
}

export default async function ClientePedidosPage() {
  const authenticatedProfile = await getAuthenticatedProfile();

  if (!authenticatedProfile) {
    redirect("/login?redirect=%2Fcliente%2Fpedidos");
  }

  if (authenticatedProfile.role !== "client") {
    redirect("/prestador");
  }

  const orders = await getClientOrders(authenticatedProfile.id);
  const pendingCount = orders.filter((order) => order.status === "PENDENTE").length;
  const confirmedCount = orders.filter(
    (order) => order.status === "ACEITA" || order.status === "CONCLUIDA",
  ).length;
  const closedCount = orders.filter(
    (order) => order.status === "RECUSADA" || order.status === "ABORTADA",
  ).length;

  return (
    <div className="min-h-screen bg-acode-mist text-text-main">
      <Header />

      <main className="px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-[0_24px_80px_rgba(4,22,39,0.08)] backdrop-blur sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-subtle">
                  Area do cliente
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-brand-navy sm:text-5xl">
                  Meus pedidos
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-text-muted">
                  Acompanhe cada solicitacao enviada aos prestadores e veja quais
                  horarios foram aceitos, recusados, concluidos ou abortados.
                </p>
              </div>

              <Link
                href="/prestador"
                className="inline-flex h-11 items-center justify-center rounded-md bg-brand-navy px-5 text-sm font-extrabold text-white transition hover:bg-brand-navy/90"
              >
                Buscar prestadores
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-border/70 bg-surface-frost p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                  Pendentes
                </p>
                <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-brand-navy">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-surface-frost p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                  Confirmados
                </p>
                <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-brand-navy">
                  {confirmedCount}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-surface-frost p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                  Encerrados
                </p>
                <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-brand-navy">
                  {closedCount}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8">
            {orders.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-border-soft bg-white/70 p-10 text-center shadow-[0_20px_70px_rgba(4,22,39,0.06)] backdrop-blur">
                <ClipboardList className="mx-auto size-8 text-brand-slate" />
                <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-brand-navy">
                  Nenhum pedido enviado ainda
                </h2>
                <p className="mt-3 text-base leading-8 text-text-muted">
                  Quando voce solicitar um horario a um prestador, ele aparecera
                  aqui com o status atualizado.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_20px_70px_rgba(4,22,39,0.08)] backdrop-blur"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                          Prestador
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-brand-navy">
                          {order.professional_name}
                        </h2>
                        {order.location ? (
                          <p className="mt-2 inline-flex items-center gap-2 text-sm text-text-muted">
                            <MapPin className="size-4" />
                            {order.location}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={[
                          "inline-flex w-max rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em]",
                          getStatusClasses(order.status),
                        ].join(" ")}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-surface-frost p-4">
                        <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                          <ReceiptText className="size-3.5" />
                          Servico solicitado
                        </p>
                        <p className="mt-2 text-lg font-black text-brand-navy">
                          {order.service_title ?? "Servico nao identificado"}
                        </p>
                        {order.service_category_name ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                            {order.service_category_name}
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-2xl bg-surface-frost p-4">
                        <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                          <CalendarDays className="size-3.5" />
                          Data do servico
                        </p>
                        <p className="mt-2 text-lg font-black text-brand-navy">
                          {formatDateTime(order.date_service)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-surface-frost p-4">
                        <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                          <Clock3 className="size-3.5" />
                          Pedido criado em
                        </p>
                        <p className="mt-2 text-lg font-black text-brand-navy">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {order.professional_slug ? (
                        <Link
                          href={`/prestador/${order.professional_slug}`}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-bold text-brand-navy transition hover:border-brand-navy/30"
                        >
                          Ver prestador
                        </Link>
                      ) : null}

                      {order.status === "ACEITA" ? (
                        <span className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-peach px-4 text-sm font-bold text-brand-brown">
                          <CircleCheckBig className="size-4" />
                          Horario confirmado
                        </span>
                      ) : null}

                      {order.status === "RECUSADA" || order.status === "ABORTADA" ? (
                        <span className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-orange/10 px-4 text-sm font-bold text-brand-orange">
                          <XCircle className="size-4" />
                          Solicitacao nao confirmada
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
