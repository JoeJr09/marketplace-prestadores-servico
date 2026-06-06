"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  NotebookTabs,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type SidebarTab = "services" | "requests";

type ProfessionalServiceSidebarProps = {
  profileId: string;
  activeTab: SidebarTab;
  pendingRequestsCount: number;
  rating: number | null;
  totalReviews: number | null;
  isVerified: boolean;
};

const navItems = [
  {
    label: "Gerenciar servicos",
    href: (profileId: string) =>
      `/professional/${profileId}/service-management`,
    icon: BriefcaseBusiness,
    tab: "services" as const,
  },
  {
    label: "Solicitacoes",
    href: (profileId: string) =>
      `/professional/${profileId}/service-management?tab=requests`,
    icon: NotebookTabs,
    tab: "requests" as const,
  },
];

export function ProfessionalServiceSidebar({
  profileId,
  activeTab,
  pendingRequestsCount,
  rating,
  totalReviews,
  isVerified,
}: ProfessionalServiceSidebarProps) {
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r-0"
    >
      <SidebarHeader className="gap-5 px-4 py-5 lg:px-5 lg:py-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-brand-navy">
            Acode Aqui
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-text-subtle">
            Professional Portal
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
                  <SidebarMenuItem
                    key={item.label}
                  >
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={
                        activeTab === item.tab
                      }
                      tooltip={item.label}
                      className="rounded-2xl px-4 text-[11px] font-semibold uppercase tracking-[0.22em] data-[active=true]:bg-brand-navy data-[active=true]:text-white"
                    >
                      <Link
                        href={item.href(
                          profileId,
                        )}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.tab === "requests" &&
                    pendingRequestsCount > 0 ? (
                      <SidebarMenuBadge>
                        {pendingRequestsCount}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 rounded-[1.75rem] border border-border/70 bg-white/80 p-5 shadow-[0_14px_40px_rgba(4,22,39,0.06)]">
          <SidebarGroupContent>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Profile Pulse
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-black tracking-[-0.05em] text-brand-navy">
                  {rating?.toFixed(1) ?? "0.0"}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  {totalReviews ?? 0} reviews
                </p>
              </div>

              <div className="rounded-2xl bg-brand-peach px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                {isVerified
                  ? "Verified"
                  : "In Review"}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto px-3 pb-5">
        <div className="rounded-[1.75rem] bg-brand-steel-mid p-5 text-white shadow-[0_20px_50px_rgba(26,43,60,0.25)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            Launch Pad
          </p>
          <p className="mt-3 text-lg font-black tracking-[-0.03em]">
            Post a new service
          </p>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Organize future tags, categories and pricing structures from one place.
          </p>
          <Button
            type="button"
            variant="brand"
            className="mt-5 w-full rounded-2xl border border-white/10 bg-brand-orange text-white hover:bg-brand-orange/90"
          >
            Initialize Draft
          </Button>
        </div>

        <div className="px-2 pt-4 text-xs text-text-subtle">
          <p className="uppercase tracking-[0.24em]">
            Help Center
          </p>
          <p className="mt-2 uppercase tracking-[0.24em]">
            Privacy
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
