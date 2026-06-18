import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Pencil, Star } from "lucide-react";

import Footer from "@/components/e/Footer";
import Header from "@/components/e/Header";
import LogoutButton from "@/components/e/LogoutButton";
import { ServiceRequestForm } from "@/components/e/ServiceRequestForm";
import { getProfessionalPortalProfileByBusinessName } from "@/app/lib/professional-portal";
import { getProfessionalServices } from "@/app/lib/professional-services";
import { verifyAccessToken } from "@/app/lib/jwt";
import { normalizeBusinessName } from "@/app/lib/professional-slug";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";
import { ProfessionalPortalProfileOverview } from "@/components/professionals/ProfessionalPortalProfileOverview";
import { ProfessionalPortalShell } from "@/components/professionals/ProfessionalPortalShell";
import { Button } from "@/components/ui/button";

type AuthenticatedUser = {
  id: string;
  role: "client" | "professional" | "admin";
};

type ProfessionalDetail = {
  id: string;
  profile_id: string;
  business_name: string | null;
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  is_insured: boolean;
  avg_rating: number | null;
  total_reviews: number | null;
  avg_response_hours: number | null;
  profile: {
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
};

const detailSelect = `
  id,
  profile_id,
  business_name,
  bio,
  years_experience,
  city,
  country,
  is_verified,
  is_insured,
  avg_rating,
  total_reviews,
  avg_response_hours,
  profiles!inner (
    full_name,
    email,
    phone,
    avatar_url,
    role
  )
`;

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);

    return {
      id: payload.id,
      role: payload.role,
    } satisfies AuthenticatedUser;
  } catch {
    return null;
  }
}

async function getProfessionalByBusinessName(businessName: string) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("professionals")
    .select(detailSelect)
    .eq("profiles.role", "professional");

  if (error || !data) {
    return null;
  }

  const professional = data.find(
    (item) => normalizeBusinessName(item.business_name ?? "") === businessName,
  );

  if (!professional) {
    return null;
  }

  const profile = Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles;

  return {
    id: professional.id,
    profile_id: professional.profile_id,
    business_name: professional.business_name,
    bio: professional.bio,
    years_experience: professional.years_experience,
    city: professional.city,
    country: professional.country,
    is_verified: professional.is_verified,
    is_insured: professional.is_insured,
    avg_rating: professional.avg_rating,
    total_reviews: professional.total_reviews,
    avg_response_hours: professional.avg_response_hours,
    profile: {
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? "",
      phone: profile?.phone ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
  } satisfies ProfessionalDetail;
}

async function getAcceptedSlots(professionalId: string) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("calendar")
    .select("date_service")
    .eq("id_professional", professionalId)
    .eq("status", "ACEITA")
    .order("date_service", {
      ascending: true,
    });

  if (error || !data) {
    return [];
  }

  return data
    .map((slot) => slot.date_service)
    .filter((slot): slot is string => typeof slot === "string");
}

function getInitials(name: string) {
  return name
    .split("-")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function PrestadorDetailPage({
  params,
}: {
  params: Promise<{ businessName: string }>;
}) {
  const { businessName } = await params;
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    const redirectPath = `/prestador/${encodeURIComponent(businessName)}`;
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  const normalizedBusinessName = normalizeBusinessName(
    decodeURIComponent(businessName),
  );
  const professional =
    await getProfessionalByBusinessName(normalizedBusinessName);

  if (!professional) {
    notFound();
  }

  const displayName =
    professional.business_name || professional.profile.full_name || "prestador";
  const isOwner = authenticatedUser.id === professional.profile_id;
  const isClientViewer = authenticatedUser.role === "client";
  const location = [professional.city, professional.country]
    .filter(Boolean)
    .join(", ");
  const acceptedSlots = await getAcceptedSlots(professional.id);
  const services = await getProfessionalServices(professional.id, {
    activeOnly: true,
  });

  if (isOwner) {
    const portalProfile = await getProfessionalPortalProfileByBusinessName(
      normalizedBusinessName,
    );

    if (!portalProfile) {
      notFound();
    }

    return (
      <ProfessionalPortalShell professional={portalProfile} activeItem="profile">
        <ProfessionalPortalProfileOverview
          professional={portalProfile}
          businessName={normalizedBusinessName}
        />
      </ProfessionalPortalShell>
    );
  }

  return (
    <div className="min-h-screen bg-acode-mist text-brand-navy">
      <Header />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" className="w-max px-0">
            <Link href="/prestador">
              <ArrowLeft className="size-4" />
              Voltar para prestadores
            </Link>
          </Button>

          {isOwner ? <LogoutButton accountType="professional" /> : null}
        </div>

        <section className="grid gap-0 overflow-hidden rounded-lg bg-acode-panel shadow-[0_18px_45px_-36px_rgba(4,22,39,0.7)] lg:grid-cols-[220px_1fr]">
          <div className="flex items-start justify-center bg-[linear-gradient(160deg,#dee4e3_0%,#cbd5e1_52%,#94a3b8_100%)] p-4 sm:p-5">
            {professional.profile.avatar_url ? (
              <img
                src={professional.profile.avatar_url}
                alt={displayName}
                className="h-[240px] w-full max-w-[180px] rounded-[1.5rem] border border-white/50 bg-white/30 object-cover shadow-[0_20px_40px_rgba(4,22,39,0.16)] sm:h-[300px] sm:max-w-[190px]"
              />
            ) : (
              <div className="flex h-[240px] w-full max-w-[180px] items-center justify-center rounded-[1.5rem] border border-white/50 bg-white/70 text-4xl font-black text-brand-navy shadow-[0_20px_40px_rgba(4,22,39,0.12)] sm:h-[300px] sm:max-w-[190px]">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <div className="p-7 sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-brown">
                  {professional.is_verified
                    ? "prestador verificado"
                    : "em análise"}
                </p>
                <h1 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                  {displayName}
                </h1>
                {professional.profile.full_name ? (
                  <p className="mt-2 text-sm text-text-muted">
                    Responsável: {professional.profile.full_name}
                  </p>
                ) : null}
              </div>
              <span className="inline-flex w-max items-center gap-1 bg-brand-navy px-3 py-2 text-sm font-black text-white">
                <Star className="size-4 fill-white" />
                {(professional.avg_rating ?? 0).toFixed(1)}
              </span>
            </div>

            {location ? (
              <p className="mt-6 flex items-center gap-2 text-text-muted">
                <MapPin className="size-4" />
                {location}
              </p>
            ) : null}

            <p className="mt-8 text-lg leading-8 text-text-muted">
              {professional.bio ||
                "Prestador cadastrado na plataforma. O perfil ainda pode ser complementado com descrição, cidade, anos de experiência e foto."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-md bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">
                  Experiência
                </p>
                <p className="mt-2 text-2xl font-black">
                  {professional.years_experience ?? 0} anos
                </p>
              </div>
              <div className="rounded-md bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">
                  Avaliações
                </p>
                <p className="mt-2 text-2xl font-black">
                  {professional.total_reviews ?? 0}
                </p>
              </div>
              <div className="rounded-md bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">
                  Resposta
                </p>
                <p className="mt-2 text-2xl font-black">
                  {professional.avg_response_hours ?? 0}h
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {isOwner ? (
                <Button asChild variant="surface" size="xl" className="rounded-md">
                  <Link href={`/prestador/${normalizedBusinessName}/edit`}>
                    <Pencil className="size-4" />
                    Editar perfil
                  </Link>
                </Button>
              ) : null}
            </div>

            {isClientViewer && !isOwner ? (
              <section className="mt-10 rounded-[1.75rem] border border-border/70 bg-white/75 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                      Trabalhos oferecidos
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-brand-navy">
                      Escolha o serviço desejado
                    </h2>
                  </div>
                  <p className="text-sm text-text-muted">
                    Selecione um dos serviços abaixo para agendar com este prestador.
                  </p>
                </div>

                <div className="mt-5 grid gap-4">
                  {services.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border-soft bg-surface-frost p-5 text-sm text-text-muted">
                      Este prestador ainda não cadastrou serviços ativos.
                    </div>
                  ) : (
                    services.map((service) => (
                      <article
                        key={service.id}
                        className="rounded-[1.5rem] border border-border/70 bg-surface-frost p-4"
                      >
                        <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)_220px] lg:items-start">
                          <div className="relative overflow-hidden rounded-[1.25rem] border border-border/70 bg-white/70">
                            {service.image_url ? (
                              <img
                                src={service.image_url}
                                alt={service.title}
                                className="h-40 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-40 items-end bg-[linear-gradient(155deg,#f5fafa_0%,#cbd5e1_42%,#64748b_100%)] p-4">
                              </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <span className="rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-brown shadow-[0_8px_24px_rgba(4,22,39,0.12)]">
                                {service.category.name}
                              </span>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-brand-navy">
                              {service.title}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-text-muted">
                              {service.description ?? "Sem descrição cadastrada."}
                            </p>
                            {service.base_price !== null ? (
                              <p className="mt-4 text-sm font-semibold text-brand-brown">
                                Valor base:{" "}
                                <span className="font-black text-brand-navy">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(service.base_price)}
                                </span>
                              </p>
                            ) : null}
                          </div>

                          <div className="w-full max-w-2xl lg:w-full">
                            <ServiceRequestForm
                              professionalId={professional.id}
                              serviceId={service.id}
                              serviceTitle={service.title}
                              unavailableSlots={acceptedSlots}
                            />
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
