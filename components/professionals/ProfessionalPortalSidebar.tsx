"use client";

import Link from "next/link";
import { BriefcaseBusiness, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type ProfessionalPortalSidebarProps = {
  businessName: string;
  activeItem: "profile" | "services";
  rating: number | null;
  totalReviews: number | null;
  isVerified: boolean;
};

const navItems = [
  {
    label: "Perfil",
    href: (businessName: string) => `/prestador/${businessName}`,
    icon: Settings2,
    item: "profile" as const,
  },
  {
    label: "Serviços",
    href: (businessName: string) =>
      `/prestador/${businessName}/service-management`,
    icon: BriefcaseBusiness,
    item: "services" as const,
  },
];

export function ProfessionalPortalSidebar({
  businessName,
  activeItem,
  rating,
  totalReviews,
  isVerified,
}: ProfessionalPortalSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r-0">
      <SidebarHeader className="gap-5 px-4 py-5 lg:px-5 lg:py-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-brand-navy">
            Acode Aqui
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-text-subtle">
            Portal do prestador
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-4">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={activeItem === item.item}
                      tooltip={item.label}
                      className="rounded-2xl px-4 text-[11px] font-semibold uppercase tracking-[0.22em] data-[active=true]:bg-brand-navy data-[active=true]:text-white"
                    >
                      <Link href={item.href(businessName)}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 rounded-[1.75rem] border border-border/70 bg-white/80 p-5 shadow-[0_14px_40px_rgba(4,22,39,0.06)]">
          <SidebarGroupContent>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Perfil
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-black tracking-[-0.05em] text-brand-navy">
                  {rating?.toFixed(1) ?? "0.0"}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  {totalReviews ?? 0} avaliações
                </p>
              </div>

              <div className="rounded-2xl bg-brand-peach px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                {isVerified ? "Verificado" : "Em análise"}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto px-3 pb-5">
        <div className="rounded-[1.75rem] bg-brand-steel-mid p-5 text-white shadow-[0_20px_50px_rgba(26,43,60,0.25)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            Serviços
          </p>
          <p className="mt-3 text-lg font-black tracking-[-0.03em]">
            Organize seu catálogo
          </p>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Centralize perfil, pedidos e serviços em uma navegação só.
          </p>
          <Button
            asChild
            type="button"
            variant="brand"
            className="mt-5 w-full rounded-2xl border border-white/10 bg-brand-orange text-white hover:bg-brand-orange/90"
          >
            <Link href={`/prestador/${businessName}/service-management`}>
              Abrir serviços
            </Link>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
