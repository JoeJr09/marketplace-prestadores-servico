import Link from "next/link";
import { MapPin, Star } from "lucide-react";

import Footer from "@/components/e/Footer";
import Header from "@/components/e/Header";
import { getProfessionalSlug } from "@/app/lib/professional-slug";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import { Button } from "@/components/ui/button";

type ProfessionalCard = {
  id: string;
  business_name: string | null;
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  avg_rating: number | null;
  total_reviews: number | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

const professionalSelect = `
  id,
  business_name,
  bio,
  years_experience,
  city,
  country,
  is_verified,
  avg_rating,
  total_reviews,
  profiles!inner (
    full_name,
    avatar_url,
    role
  )
`;

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getProfessionals() {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("professionals")
    .select(professionalSelect)
    .eq("profiles.role", "professional")
    .order("created_at", {
      ascending: false,
    });

  if (error || !data) {
    return [];
  }

  return data.map((professional) => {
    const profile = Array.isArray(professional.profiles)
      ? professional.profiles[0]
      : professional.profiles;

    return {
      id: professional.id,
      business_name: professional.business_name,
      bio: professional.bio,
      years_experience: professional.years_experience,
      city: professional.city,
      country: professional.country,
      is_verified: professional.is_verified,
      avg_rating: professional.avg_rating,
      total_reviews: professional.total_reviews,
      profile: {
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
    } satisfies ProfessionalCard;
  });
}

function getDisplayName(professional: ProfessionalCard) {
  return (
    professional.business_name ||
    professional.profile.full_name ||
    "prestador-sem-nome"
  );
}

function getLocation(professional: ProfessionalCard) {
  return [professional.city, professional.country].filter(Boolean).join(", ");
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

export default async function PrestadorPage() {
  const professionals = await getProfessionals();

  return (
    <div className="min-h-screen bg-acode-mist text-brand-navy">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
            Encontre um prestador de serviços
          </h1>
          <p className="mt-3 max-w-2xl text-base text-text-muted">
            Prestadores reais cadastrados no Supabase. Para abrir detalhes de um
            profissional específico, entre com sua conta de cliente.
          </p>
        </div>

        {professionals.length === 0 ? (
          <section className="rounded-lg bg-white/70 p-8 text-text-muted">
            Nenhum prestador cadastrado ainda.
          </section>
        ) : (
          <section className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {professionals.map((professional) => {
              const displayName = getDisplayName(professional);
              const slug = getProfessionalSlug(professional);
              const location = getLocation(professional);

              return (
                <article
                  key={professional.id}
                  className="overflow-hidden rounded-lg bg-acode-panel shadow-[0_18px_45px_-36px_rgba(4,22,39,0.7)]"
                >
                  <div className="flex min-h-64 items-center justify-center bg-[linear-gradient(160deg,#dee4e3_0%,#cbd5e1_52%,#94a3b8_100%)]">
                    {professional.profile.avatar_url ? (
                      <div
                        className="h-full min-h-64 w-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${professional.profile.avatar_url})`,
                        }}
                      />
                    ) : (
                      <div className="flex size-28 items-center justify-center rounded-full bg-white/70 text-4xl font-black text-brand-navy">
                        {getInitials(displayName)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black leading-7 tracking-[-0.05em]">
                          {displayName}
                        </h2>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-brand-brown">
                          {professional.is_verified ? "verificado" : "em análise"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-brand-navy px-2 py-1 text-xs font-black text-white">
                        <Star className="size-3 fill-white" />
                        {(professional.avg_rating ?? 0).toFixed(1)}
                      </span>
                    </div>

                    {location ? (
                      <p className="flex items-center gap-2 text-sm text-text-muted">
                        <MapPin className="size-4" />
                        {location}
                      </p>
                    ) : null}

                    <p className="min-h-16 text-sm leading-6 text-text-muted">
                      {professional.bio ||
                        "Prestador cadastrado na plataforma, pronto para configurar serviços e receber solicitações."}
                    </p>

                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-text-subtle">
                      <span>{professional.years_experience ?? 0} anos</span>
                      <span>{professional.total_reviews ?? 0} reviews</span>
                    </div>

                    {slug ? (
                      <Button
                        asChild
                        variant="brand"
                        className="h-11 w-full rounded-md text-sm font-black"
                      >
                        <Link href={`/prestador/${slug}`}>Ver detalhes</Link>
                      </Button>
                    ) : (
                      <Button
                        variant="surface"
                        className="h-11 w-full rounded-md text-sm font-black"
                        disabled
                      >
                        Nome de empresa pendente
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
