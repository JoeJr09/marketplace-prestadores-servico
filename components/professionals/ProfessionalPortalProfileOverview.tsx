import Link from "next/link";
import {
  MapPin,
  Pencil,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProfessionalDashboardProfile } from "@/components/professionals/service-management.types";

type ProfessionalPortalProfileOverviewProps = {
  professional: ProfessionalDashboardProfile;
  businessName: string;
};

function getInitials(name: string) {
  return name
    .split("-")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() ?? "",
    )
    .join("");
}

export function ProfessionalPortalProfileOverview({
  professional,
  businessName,
}: ProfessionalPortalProfileOverviewProps) {
  const displayName =
    professional.business_name ||
    professional.profile.full_name ||
    "prestador";
  const location = [
    professional.city,
    professional.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">
            Portal do Prestador
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-brand-navy sm:text-5xl">
            Meu perfil
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-text-muted">
            Acompanhe sua apresentação pública e use os atalhos para editar seus dados ou gerenciar seus serviços.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="surface"
            size="xl"
            className="rounded-2xl"
          >
            <Link
              href={`/prestador/${businessName}/edit`}
            >
              <Pencil className="size-4" />
              Editar perfil
            </Link>
          </Button>
          <Button
            asChild
            variant="brand"
            size="xl"
            className="rounded-2xl"
          >
            <Link
              href={`/prestador/${businessName}/service-management`}
            >
              Servicos
            </Link>
          </Button>
        </div>
      </div>

      <section className="mt-8 grid overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_18px_50px_rgba(4,22,39,0.08)] lg:grid-cols-[340px_1fr]">
        <div className="flex min-h-96 items-center justify-center bg-[linear-gradient(160deg,#dee4e3_0%,#cbd5e1_52%,#94a3b8_100%)]">
          {professional.profile.avatar_url ? (
            <div
              className="h-full min-h-96 w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${professional.profile.avatar_url})`,
              }}
            />
          ) : (
            <div className="flex size-32 items-center justify-center rounded-full bg-white/70 text-4xl font-black text-brand-navy">
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
                  : "em analise"}
              </p>
              <h2 className="mt-3 text-5xl font-black tracking-[-0.06em] text-brand-navy">
                {displayName}
              </h2>
              {professional.profile.full_name ? (
                <p className="mt-2 text-sm text-text-muted">
                  Responsavel:{" "}
                  {professional.profile.full_name}
                </p>
              ) : null}
            </div>
            <span className="inline-flex w-max items-center gap-1 rounded-2xl bg-brand-navy px-3 py-2 text-sm font-black text-white">
              <Star className="size-4 fill-white" />
              {(
                professional.avg_rating ??
                0
              ).toFixed(1)}
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
              "Prestador cadastrado na plataforma. O perfil ainda pode ser complementado com descricao, cidade, anos de experiencia e foto."}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-surface-frost p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">
                Experiencia
              </p>
              <p className="mt-2 text-2xl font-black text-brand-navy">
                {professional.years_experience ??
                  0}{" "}
                anos
              </p>
            </div>
            <div className="rounded-2xl bg-surface-frost p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">
                Reviews
              </p>
              <p className="mt-2 text-2xl font-black text-brand-navy">
                {professional.total_reviews ??
                  0}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-frost p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">
                Status
              </p>
              <p className="mt-2 text-2xl font-black text-brand-navy">
                {professional.is_insured
                  ? "Seguro"
                  : "Sem seguro"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
