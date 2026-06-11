"use client";

import type { ReactNode } from "react";

import Footer from "@/components/e/Footer";
import Header from "@/components/e/Header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ProfessionalDashboardProfile } from "@/components/professionals/service-management.types";
import { ProfessionalPortalSidebar } from "@/components/professionals/ProfessionalPortalSidebar";

type ProfessionalPortalShellProps = {
  professional: ProfessionalDashboardProfile;
  activeItem: "profile" | "services";
  children: ReactNode;
};

export function ProfessionalPortalShell({
  professional,
  activeItem,
  children,
}: ProfessionalPortalShellProps) {
  const businessName =
    professional.business_name ??
    "prestador";

  return (
    <div className="min-h-screen bg-acode-mist text-brand-navy">
      <Header />

      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <TooltipProvider>
          <SidebarProvider defaultOpen>
            <div className="mx-auto w-full max-w-[1540px] text-text-main">
              <div className="flex min-h-[calc(100vh-13rem)] overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_28px_80px_rgba(4,22,39,0.08)] backdrop-blur">
                <ProfessionalPortalSidebar
                  businessName={businessName}
                  activeItem={activeItem}
                  rating={professional.avg_rating}
                  totalReviews={
                    professional.total_reviews
                  }
                  isVerified={
                    professional.is_verified
                  }
                />

                <SidebarInset className="bg-transparent">
                  <div className="flex min-h-full flex-col p-5 sm:p-7 lg:p-8 xl:p-10">
                    {children}
                  </div>
                </SidebarInset>
              </div>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </main>

      <Footer />
    </div>
  );
}
