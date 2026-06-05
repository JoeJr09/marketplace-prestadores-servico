"use client";

import { type FormEvent, useState } from "react";
import {
  ClipboardList,
  PencilLine,
  PlusCircle,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ProfessionalServiceFooter } from "@/components/professionals/ProfessionalServiceFooter";
import { ProfessionalServiceHeader } from "@/components/professionals/ProfessionalServiceHeader";
import { ProfessionalServiceSidebar } from "@/components/professionals/ProfessionalServiceSidebar";
import type {
  ProfessionalDashboardProfile,
  ServiceCard,
  ServiceCategory,
} from "@/components/professionals/service-management.types";

type ServiceManagementWorkspaceProps = {
  professional: ProfessionalDashboardProfile;
};

const initialServices: ServiceCard[] = [
  {
    id: "surveying",
    title: "Industrial Site Surveying",
    category: "Engineering",
    fee: "1,250",
    unit: "project",
    description:
      "Topographic review and structural assessment designed for complex urban plots and brownfield conversions.",
    tag: "Structural Grade",
    status: "Active",
  },
  {
    id: "grid",
    title: "Smart Grid Integration",
    category: "Automation",
    fee: "450",
    unit: "unit",
    description:
      "Energy optimization blueprint for connected industrial lots, retrofits, and distributed systems.",
    tag: "Technical Tier",
    status: "Draft",
  },
];

const suggestedDomains = [
  "Construction",
  "Civil Work",
  "Automation",
  "Urban HVAC",
];

function getDomainDefaults(
  professional: ProfessionalDashboardProfile,
) {
  const dynamic = [];

  if (professional.city) {
    dynamic.push(professional.city);
  }

  if (professional.tier_label) {
    dynamic.push(professional.tier_label);
  }

  if (professional.is_insured) {
    dynamic.push("Insured");
  }

  return Array.from(
    new Set(
      [...suggestedDomains, ...dynamic].filter(
        Boolean,
      ),
    ),
  );
}

export function ServiceManagementWorkspace({
  professional,
}: ServiceManagementWorkspaceProps) {
  const [services, setServices] =
    useState(initialServices);
  const [domains, setDomains] = useState(
    getDomainDefaults(professional),
  );
  const [formData, setFormData] = useState({
    title: "",
    category: "Engineering" as ServiceCategory,
    fee: "",
    description: "",
  });

  const activeOfferings = services.filter(
    (service) => service.status === "Active",
  ).length;

  function handleCreateService(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.description.trim()
    ) {
      return;
    }

    setServices((current) => [
      {
        id: crypto.randomUUID(),
        title: formData.title.trim(),
        category: formData.category,
        fee: formData.fee.trim() || "0",
        unit: "project",
        description:
          formData.description.trim(),
        tag: "New Blueprint",
        status: "Draft",
      },
      ...current,
    ]);

    setFormData({
      title: "",
      category: "Engineering",
      fee: "",
      description: "",
    });
  }

  function toggleDomain(domain: string) {
    setDomains((current) =>
      current.includes(domain)
        ? current.filter(
            (item) => item !== domain,
          )
        : [...current, domain],
    );
  }

  function removeService(id: string) {
    setServices((current) =>
      current.filter(
        (service) => service.id !== id,
      ),
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full bg-[linear-gradient(180deg,#f8fbfb_0%,#eff5f4_52%,#dee4e3_100%)] p-4 text-text-main sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1540px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_28px_80px_rgba(4,22,39,0.08)] backdrop-blur">
          <ProfessionalServiceSidebar
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
              <ProfessionalServiceHeader
                professional={professional}
              />

              <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
                <section className="space-y-6">
                  <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(4,22,39,0.08)]">
                    <div className="flex items-center gap-3">
                      <PlusCircle className="size-5 text-brand-navy" />
                      <h2 className="text-2xl font-black tracking-[-0.03em] text-brand-navy">
                        New Service Blueprint
                      </h2>
                    </div>

                    <form
                      className="mt-6 grid gap-5"
                      onSubmit={
                        handleCreateService
                      }
                    >
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                          Service Title
                        </label>
                        <Input
                          value={formData.title}
                          onChange={(event) =>
                            setFormData(
                              (current) => ({
                                ...current,
                                title:
                                  event.target
                                    .value,
                              }),
                            )
                          }
                          className="h-[3.25rem] rounded-[1.5rem] border-border/70 bg-surface-muted px-4 text-base"
                          placeholder="e.g. Urban HVAC Architecture"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                            Category
                          </label>
                          <select
                            value={
                              formData.category
                            }
                            onChange={(event) =>
                              setFormData(
                                (current) => ({
                                  ...current,
                                  category:
                                    event
                                      .target
                                      .value as ServiceCategory,
                                }),
                              )
                            }
                            className="h-[3.25rem] w-full rounded-[1.5rem] border border-border/70 bg-surface-muted px-4 text-sm font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-navy/15"
                          >
                            <option>
                              Engineering
                            </option>
                            <option>
                              Operations
                            </option>
                            <option>
                              Automation
                            </option>
                            <option>
                              Infrastructure
                            </option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                            Base Price (USD)
                          </label>
                          <Input
                            value={formData.fee}
                            onChange={(event) =>
                              setFormData(
                                (current) => ({
                                  ...current,
                                  fee: event
                                    .target
                                    .value,
                                }),
                              )
                            }
                            className="h-[3.25rem] rounded-[1.5rem] border-border/70 bg-surface-muted px-4 text-base"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                          Technical Description
                        </label>
                        <textarea
                          rows={5}
                          value={
                            formData.description
                          }
                          onChange={(event) =>
                            setFormData(
                              (current) => ({
                                ...current,
                                description:
                                  event.target
                                    .value,
                              }),
                            )
                          }
                          className="w-full resize-none rounded-[1.5rem] border border-border/70 bg-surface-muted px-4 py-4 text-sm leading-7 text-text-main outline-none focus:ring-2 focus:ring-brand-navy/15"
                          placeholder="Detail the structural scope and technical requirements..."
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="brand"
                        size="xl"
                        className="mt-2 rounded-[1.5rem] text-xs uppercase tracking-[0.26em]"
                      >
                        Initialize Service
                      </Button>
                    </form>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(4,22,39,0.08)]">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="size-5 text-brand-navy" />
                        <div>
                          <h3 className="text-lg font-black tracking-[-0.03em] text-brand-navy">
                            Active Domains
                          </h3>
                          <p className="text-sm text-text-muted">
                            Tags will later sync with the API that links professionals to their selected categories.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {suggestedDomains.map(
                          (domain) => {
                            const active =
                              domains.includes(
                                domain,
                              );

                            return (
                              <button
                                key={domain}
                                type="button"
                                onClick={() =>
                                  toggleDomain(
                                    domain,
                                  )
                                }
                                className={[
                                  "rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition",
                                  active
                                    ? "border-brand-navy bg-brand-navy text-white"
                                    : "border-border bg-surface-muted text-brand-steel-deep hover:border-brand-slate hover:text-brand-navy",
                                ].join(" ")}
                              >
                                {domain}
                              </button>
                            );
                          },
                        )}

                        <span className="inline-flex rounded-full border border-dashed border-border-soft px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                          API Tags Soon
                        </span>
                      </div>
                    </section>

                    <section className="flex min-h-[232px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-border-soft bg-[linear-gradient(180deg,rgba(203,213,225,0.16),rgba(255,255,255,0.86))] p-6 text-center">
                      <Sparkles className="size-7 text-brand-slate" />
                      <h3 className="mt-5 text-2xl font-black tracking-[-0.03em] text-brand-steel-deep">
                        Expand Your Urban Footprint
                      </h3>
                      <p className="mt-3 max-w-sm text-sm leading-7 text-text-muted">
                        Click to draft a new professional service and reach more enterprise clients.
                      </p>
                    </section>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(4,22,39,0.08)]">
                  <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">
                        Current Portfolio
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-brand-navy">
                        Service Catalog
                      </h2>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-steel-deep">
                      {activeOfferings} active offerings
                    </p>
                  </div>

                  <div className="mt-6 grid gap-5">
                    {services.map((service, index) => (
                      <article
                        key={service.id}
                        className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-surface-frost p-4 lg:grid-cols-[190px_minmax(0,1fr)]"
                      >
                        <div
                          className={[
                            "relative overflow-hidden rounded-[1.4rem] border border-brand-charcoal/10",
                            index % 2 === 0
                              ? "bg-[linear-gradient(150deg,#f5fafa_0%,#cbd5e1_38%,#44474c_100%)]"
                              : "bg-[linear-gradient(155deg,#171d1d_0%,#44474c_46%,#64748b_100%)]",
                          ].join(" ")}
                        >
                          <div className="absolute inset-y-0 left-0 w-1 bg-brand-navy" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_44%)]" />
                          <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full border border-white/15" />
                          <div className="relative flex h-full min-h-[190px] items-end p-5">
                            <span className="rounded-full bg-white/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-brown">
                              {service.tag}
                            </span>
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-col justify-between">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                                {service.category}
                              </p>
                              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-brand-navy">
                                {service.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-full border border-border/70 bg-white p-2 text-brand-steel-deep transition hover:border-brand-slate hover:text-brand-navy"
                                aria-label={`Editar ${service.title}`}
                              >
                                <PencilLine className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  removeService(
                                    service.id,
                                  )
                                }
                                className="rounded-full border border-border/70 bg-white p-2 text-brand-steel-deep transition hover:border-brand-orange hover:text-brand-orange"
                                aria-label={`Remover ${service.title}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>

                          <p className="mt-4 max-w-xl text-sm leading-7 text-text-muted">
                            {service.description}
                          </p>

                          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                                Base Rate
                              </p>
                              <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-brand-navy">
                                ${service.fee}
                                <span className="ml-1 text-base font-medium text-text-muted">
                                  /{service.unit}
                                </span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={[
                                  "inline-flex rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em]",
                                  service.status ===
                                  "Active"
                                    ? "bg-brand-peach text-brand-brown"
                                    : "bg-brand-orange/12 text-brand-orange",
                                ].join(" ")}
                              >
                                {service.status}
                              </span>
                              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-brown" />
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <ProfessionalServiceFooter />
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
