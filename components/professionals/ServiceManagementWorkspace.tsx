"use client";

import { type FormEvent, useRef, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  PencilLine,
  PlusCircle,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { formatCurrency } from "@/app/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfessionalServiceFooter } from "@/components/professionals/ProfessionalServiceFooter";
import { ProfessionalServiceHeader } from "@/components/professionals/ProfessionalServiceHeader";
import { ProfessionalServiceRequestsPanel } from "@/components/professionals/ProfessionalServiceRequestsPanel";
import type {
  ProfessionalDashboardProfile,
  ServiceCard,
  ServiceCategoryOption,
  ServiceRequestCard,
} from "@/components/professionals/service-management.types";

type ServiceManagementWorkspaceProps = {
  professional: ProfessionalDashboardProfile;
  serviceRequests: ServiceRequestCard[];
  categories: ServiceCategoryOption[];
  initialServices: ServiceCard[];
  activeTab: "services" | "requests";
  businessName: string;
};

type ServiceMutationResponse = {
  error?: string;
  message?: string;
  service?: ServiceCard | null;
};

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(digits) / 100);
}

function roundCurrencyValue(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrencyValueForInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundCurrencyValue(value));
}

function getServiceStatusLabel(service: ServiceCard) {
  return service.is_active ? "Ativo" : "Rascunho";
}

function getInitialFormState(categories: ServiceCategoryOption[]) {
  return {
    title: "",
    categoryId: categories[0]?.id ?? "",
    basePrice: "",
    description: "",
    imageUrl: "",
    isActive: true,
  };
}

export function ServiceManagementWorkspace({
  professional,
  serviceRequests,
  categories,
  initialServices,
  activeTab,
  businessName,
}: ServiceManagementWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [services, setServices] = useState(initialServices);
  const [serviceRequestsState, setServiceRequestsState] = useState(serviceRequests);
  const [formData, setFormData] = useState(getInitialFormState(categories));
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [serviceFeedback, setServiceFeedback] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const activeOfferings = services.filter((service) => service.is_active).length;
  const openRequestsCount = serviceRequestsState.filter(
    (request) => request.status === "PENDENTE" || request.status === "ACEITA",
  ).length;
  const activeDomainNames = Array.from(
    new Set(
      services
        .filter((service) => service.is_active)
        .map((service) => service.category.name),
    ),
  );

  function resetForm() {
    setFormData(getInitialFormState(categories));
    setEditingServiceId(null);
    setImagePreview(null);
    setServiceError(null);
    setServiceFeedback(null);
  }

  function startEditingService(service: ServiceCard) {
    setEditingServiceId(service.id);
    setServiceFeedback(null);
    setServiceError(null);
    setImagePreview(service.image_url);
    setFormData({
      title: service.title,
      categoryId: service.category.id,
      basePrice:
        service.base_price !== null
          ? formatCurrencyValueForInput(service.base_price)
          : "",
      description: service.description ?? "",
      imageUrl: service.image_url ?? "",
      isActive: service.is_active,
    });
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploadingImage(true);
    setServiceError(null);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("bucket", "service_images");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const data = (await response.json()) as {
        error?: string;
        url?: string;
      };

      if (!response.ok || !data.url) {
        setServiceError(data.error ?? "Não foi possível enviar a imagem do serviço.");
        return;
      }

      setFormData((current) => ({
        ...current,
        imageUrl: data.url ?? "",
      }));
    } catch {
      setServiceError("Não foi possível enviar a imagem do serviço.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleCreateOrUpdateService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingService(true);
    setServiceFeedback(null);
    setServiceError(null);

    const digits = formData.basePrice.replace(/\D/g, "");
    const basePrice = digits ? roundCurrencyValue(Number(digits) / 100) : null;

    try {
      const endpoint = editingServiceId
        ? `/api/professional-services/${editingServiceId}`
        : "/api/professional-services";
      const method = editingServiceId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalId: professional.professional_id,
          categoryId: formData.categoryId,
          title: formData.title,
          description: formData.description,
          basePrice,
          imageUrl: formData.imageUrl || null,
          isActive: formData.isActive,
        }),
      });

      const data = (await response.json()) as ServiceMutationResponse;

      if (!response.ok || !data.service) {
        setServiceError(data.error ?? "Não foi possível salvar o serviço.");
        return;
      }

      setServices((current) => {
        if (editingServiceId) {
          return current.map((service) =>
            service.id === editingServiceId ? data.service! : service,
          );
        }

        return [data.service!, ...current];
      });

      setServiceFeedback(
        data.message ??
          (editingServiceId
            ? "Serviço atualizado com sucesso."
            : "Serviço cadastrado com sucesso."),
      );
      resetForm();
    } catch {
      setServiceError("Não foi possível salvar o serviço.");
    } finally {
      setIsSubmittingService(false);
    }
  }

  async function handleDeleteService(serviceId: string) {
    setPendingDeleteIds((current) => [...current, serviceId]);
    setServiceError(null);
    setServiceFeedback(null);

    try {
      const response = await fetch(`/api/professional-services/${serviceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setServiceError(data.error ?? "Não foi possível remover o serviço.");
        return;
      }

      setServices((current) => current.filter((service) => service.id !== serviceId));

      if (editingServiceId === serviceId) {
        resetForm();
      }

      setServiceFeedback(data.message ?? "Serviço removido com sucesso.");
    } catch {
      setServiceError("Não foi possível remover o serviço.");
    } finally {
      setPendingDeleteIds((current) => current.filter((id) => id !== serviceId));
    }
  }

  return (
    <>
      <ProfessionalServiceHeader professional={professional} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          asChild
          variant={activeTab === "services" ? "brand" : "surface"}
          className="rounded-2xl"
        >
          <Link href={`/prestador/${businessName}/service-management`}>Serviços</Link>
        </Button>
        <Button
          asChild
          variant={activeTab === "requests" ? "brand" : "surface"}
          className="rounded-2xl"
        >
          <Link
            href={`/prestador/${businessName}/service-management?tab=requests`}
          >
            Solicitações
            {openRequestsCount > 0 ? ` (${openRequestsCount})` : ""}
          </Link>
        </Button>
      </div>

      {activeTab === "requests" ? (
        <div className="mt-8">
          <ProfessionalServiceRequestsPanel
            professional={professional}
            requests={serviceRequestsState}
            onRequestsChange={setServiceRequestsState}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(4,22,39,0.08)]">
              <div className="flex items-center gap-3">
                <PlusCircle className="size-5 text-brand-navy" />
                <h2 className="text-2xl font-black tracking-[-0.03em] text-brand-navy">
                  {editingServiceId ? "Editar serviço" : "Novo serviço"}
                </h2>
              </div>

              <form className="mt-6 grid gap-5" onSubmit={handleCreateOrUpdateService}>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                    Título do serviço
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="h-[3.25rem] rounded-[1.5rem] border-border/70 bg-surface-muted px-4 text-base"
                    placeholder="Ex.: Projeto de climatização urbana"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                      Categoria
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          categoryId: event.target.value,
                        }))
                      }
                      className="h-[3.25rem] w-full rounded-[1.5rem] border border-border/70 bg-surface-muted px-4 text-sm font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-navy/15"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                      Valor base
                    </label>
                    <Input
                      value={formData.basePrice}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          basePrice: formatCurrencyInput(event.target.value),
                        }))
                      }
                      className="h-[3.25rem] rounded-[1.5rem] border-border/70 bg-surface-muted px-4 text-base"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                    Descrição
                  </label>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="w-full resize-none rounded-[1.5rem] border border-border/70 bg-surface-muted px-4 py-4 text-sm leading-7 text-text-main outline-none focus:ring-2 focus:ring-brand-navy/15"
                    placeholder="Descreva escopo, entregáveis e diferenciais do serviço..."
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                      Imagem do serviço
                    </label>
                    <div className="flex items-center gap-4 rounded-[1.5rem] border border-border/70 bg-surface-muted p-4">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/80">
                        {imagePreview || formData.imageUrl ? (
                          <img
                            src={imagePreview ?? formData.imageUrl}
                            alt={formData.title || "Prévia do serviço"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Upload className="size-5 text-brand-slate" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Button
                          type="button"
                          variant="surface"
                          className="rounded-2xl"
                          disabled={isUploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {isUploadingImage
                            ? "Enviando..."
                            : editingServiceId
                              ? "Alterar imagem"
                              : "Escolher imagem"}
                        </Button>
                        <p className="text-xs text-text-subtle">
                          JPG, PNG, WEBP ou GIF com até 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface-muted px-4 py-3 text-sm font-semibold text-brand-navy">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          isActive: event.target.checked,
                        }))
                      }
                      className="size-4 accent-brand-navy"
                    />
                    Ativar serviço
                  </label>
                </div>

                {serviceError ? (
                  <p className="text-sm font-medium text-brand-orange">
                    {serviceError}
                  </p>
                ) : null}

                {serviceFeedback ? (
                  <p className="text-sm font-medium text-brand-brown">
                    {serviceFeedback}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    variant="brand"
                    size="xl"
                    className="mt-2 rounded-[1.5rem] text-xs uppercase tracking-[0.26em]"
                    disabled={isSubmittingService || isUploadingImage}
                  >
                    {isSubmittingService
                      ? "Salvando..."
                      : editingServiceId
                        ? "Salvar serviço"
                        : "Adicionar serviço"}
                  </Button>

                  {editingServiceId ? (
                    <Button
                      type="button"
                      variant="surface"
                      size="xl"
                      className="mt-2 rounded-[1.5rem] text-xs uppercase tracking-[0.26em]"
                      onClick={resetForm}
                    >
                      Cancelar edição
                    </Button>
                  ) : null}
                </div>
              </form>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(4,22,39,0.08)]">
                <div className="flex items-center gap-3">
                  <ClipboardList className="size-5 text-brand-navy" />
                  <div>
                    <h3 className="text-lg font-black tracking-[-0.03em] text-brand-navy">
                      Áreas ativas
                    </h3>
                    <p className="text-sm text-text-muted">
                      As categorias dos seus serviços ativos aparecem como tags no
                      diretório público.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {activeDomainNames.length > 0 ? (
                    activeDomainNames.map((domain) => (
                      <span
                        key={domain}
                        className="rounded-full border border-brand-navy bg-brand-navy px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white"
                      >
                        {domain}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex rounded-full border border-dashed border-border-soft px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                      Nenhuma categoria ativa ainda
                    </span>
                  )}
                </div>
              </section>

              <section className="flex min-h-[232px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-border-soft bg-[linear-gradient(180deg,rgba(203,213,225,0.16),rgba(255,255,255,0.86))] p-6 text-center">
                <Sparkles className="size-7 text-brand-slate" />
                <h3 className="mt-5 text-2xl font-black tracking-[-0.03em] text-brand-steel-deep">
                  Amplie sua presença
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-text-muted">
                  Cadastre serviços reais para que os clientes possam selecionar
                  exatamente o trabalho desejado.
                </p>
              </section>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(4,22,39,0.08)]">
            <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">
                  Portfólio atual
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-brand-navy">
                  Catálogo de serviços
                </h2>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-steel-deep">
                {activeOfferings} serviços ativos
              </p>
            </div>

            <div className="mt-6 grid gap-5">
              {services.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-border-soft bg-surface-frost p-6 text-center text-text-muted">
                  Nenhum serviço cadastrado ainda.
                </div>
              ) : (
                services.map((service, index) => (
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
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.title}
                          className="h-full min-h-[190px] w-full object-cover"
                        />
                      ) : null}

                      <div className="absolute inset-y-0 left-0 w-1 bg-brand-navy" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_44%)]" />
                      <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full border border-white/15" />
                      <div className="relative flex h-full min-h-[190px] items-end p-5">
                        <span className="rounded-full bg-white/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-brown">
                          {service.category.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                            {service.category.name}
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
                            onClick={() => startEditingService(service)}
                          >
                            <PencilLine className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteService(service.id)}
                            disabled={pendingDeleteIds.includes(service.id)}
                            className="rounded-full border border-border/70 bg-white p-2 text-brand-steel-deep transition hover:border-brand-orange hover:text-brand-orange disabled:opacity-60"
                            aria-label={`Remover ${service.title}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-4 max-w-xl text-sm leading-7 text-text-muted">
                        {service.description ?? "Sem descrição cadastrada."}
                      </p>

                      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                            Valor base
                          </p>
                          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-brand-navy">
                            {service.base_price !== null
                              ? formatCurrency(service.base_price)
                              : "Sob consulta"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em]",
                              service.is_active
                                ? "bg-brand-peach text-brand-brown"
                                : "bg-brand-orange/12 text-brand-orange",
                            ].join(" ")}
                          >
                            {getServiceStatusLabel(service)}
                          </span>
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-brown" />
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <ProfessionalServiceFooter />
    </>
  );
}
