"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

import type { ProfessionalDashboardProfile } from "@/components/professionals/service-management.types";

type ProfessionalServiceHeaderProps = {
  professional: ProfessionalDashboardProfile;
};

function getInitials(name: string | null) {
  if (!name) {
    return "PA";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getHeroSummary(
  yearsExperience: number | null,
  city: string | null,
  country: string | null,
) {
  const place = [city, country].filter(Boolean).join(", ");

  if (yearsExperience && place) {
    return `${yearsExperience}+ anos em projetos urbanos e execução técnica em ${place}.`;
  }

  if (yearsExperience) {
    return `${yearsExperience}+ anos em projetos urbanos, integração técnica e operações em campo.`;
  }

  if (place) {
    return `Base operacional em ${place}, com oferta pronta para serviços urbanos, manutenção e implantação técnica.`;
  }

  return "Configure seu catálogo profissional, organize serviços ativos e prepare o portfólio para futuras conexões com o marketplace.";
}

export function ProfessionalServiceHeader({
  professional,
}: ProfessionalServiceHeaderProps) {
  const ownerName =
    professional.business_name || professional.profile.full_name || "Prestador";
  const initials = getInitials(professional.profile.full_name);

  return (
    <header className="flex flex-col gap-6 border-b border-border/70 pb-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="rounded-full border border-white/70 bg-white/80 text-brand-navy shadow-[0_12px_30px_rgba(4,22,39,0.08)] md:hidden" />
          <p className="text-xs uppercase tracking-[0.26em] text-text-subtle">
            Gerenciamento de serviços
          </p>
        </div>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-brand-navy sm:text-5xl">
          Gestão de serviços
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.2em] text-brand-steel-deep">
          Organize sua oferta profissional
        </p>
        <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
          {getHeroSummary(
            professional.years_experience,
            professional.city,
            professional.country,
          )}
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-[1.75rem] border border-border/70 bg-surface-frost px-4 py-4 shadow-[0_12px_30px_rgba(4,22,39,0.06)]">
        {professional.profile.avatar_url ? (
          <img
            src={professional.profile.avatar_url}
            alt={ownerName}
            className="h-14 w-14 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#cbd5e1_0%,#94a3b8_55%,#64748b_100%)] text-lg font-black text-white">
            {initials}
          </div>
        )}

        <div>
          <p className="text-base font-black tracking-[-0.03em] text-brand-navy">
            {ownerName}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-text-subtle">
            {professional.tier_label ?? "Prestador em destaque"}
          </p>
        </div>
      </div>
    </header>
  );
}
