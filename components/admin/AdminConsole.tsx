"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Shield,
  Trash2,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminConsoleData = {
  admin: {
    id: string;
    full_name: string | null;
    email: string;
  };
  clients: ClientRecord[];
  professionals: ProfessionalRecord[];
  services: ServiceRecord[];
  categories: CategoryRecord[];
};

type ClientRecord = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

type ProfessionalRecord = {
  profile_id: string;
  professional_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  business_name: string | null;
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  is_insured: boolean;
};

type ServiceRecord = {
  id: string;
  professional_id: string;
  professional_profile_id: string | null;
  professional_business_name: string;
  category_id: string;
  category_name: string;
  title: string;
  description: string | null;
  base_price: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

type CategoryRecord = {
  id: string;
  name: string;
};

type TabKey = "clients" | "professionals" | "services";

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

function formatPriceForInput(value: number | null) {
  if (value === null) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundCurrencyValue(value));
}

export function AdminConsole() {
  const [activeTab, setActiveTab] = useState<TabKey>("clients");
  const [data, setData] = useState<AdminConsoleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [clientForm, setClientForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [professionalForm, setProfessionalForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    business_name: "",
    city: "",
    country: "",
    bio: "",
    years_experience: "",
    is_verified: false,
    is_insured: false,
  });

  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    basePrice: "",
    imageUrl: "",
    categoryId: "",
    isActive: false,
  });

  async function loadConsoleData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin-console", {
        credentials: "include",
      });
      const result = (await response.json()) as AdminConsoleData & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível carregar o painel");
      }

      setData(result);
      setSelectedClientId((current) =>
        result.clients.some((client) => client.id === current)
          ? current
          : (result.clients[0]?.id ?? ""),
      );
      setSelectedProfessionalId((current) =>
        result.professionals.some((professional) => professional.profile_id === current)
          ? current
          : (result.professionals[0]?.profile_id ?? ""),
      );
      setSelectedServiceId((current) =>
        result.services.some((service) => service.id === current)
          ? current
          : (result.services[0]?.id ?? ""),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível carregar o painel",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadConsoleData();
  }, []);

  const selectedClient =
    data?.clients.find((client) => client.id === selectedClientId) ?? null;
  const selectedProfessional =
    data?.professionals.find((professional) => professional.profile_id === selectedProfessionalId) ??
    null;
  const selectedService =
    data?.services.find((service) => service.id === selectedServiceId) ?? null;

  useEffect(() => {
    if (!selectedClient) {
      setClientForm({
        full_name: "",
        email: "",
        phone: "",
      });
      return;
    }

    setClientForm({
      full_name: selectedClient.full_name ?? "",
      email: selectedClient.email,
      phone: selectedClient.phone ?? "",
    });
  }, [selectedClient]);

  useEffect(() => {
    if (!selectedProfessional) {
      setProfessionalForm({
        full_name: "",
        email: "",
        phone: "",
        business_name: "",
        city: "",
        country: "",
        bio: "",
        years_experience: "",
        is_verified: false,
        is_insured: false,
      });
      return;
    }

    setProfessionalForm({
      full_name: selectedProfessional.full_name ?? "",
      email: selectedProfessional.email,
      phone: selectedProfessional.phone ?? "",
      business_name: selectedProfessional.business_name ?? "",
      city: selectedProfessional.city ?? "",
      country: selectedProfessional.country ?? "",
      bio: selectedProfessional.bio ?? "",
      years_experience:
        selectedProfessional.years_experience !== null
          ? String(selectedProfessional.years_experience)
          : "",
      is_verified: selectedProfessional.is_verified,
      is_insured: selectedProfessional.is_insured,
    });
  }, [selectedProfessional]);

  useEffect(() => {
    if (!selectedService) {
      setServiceForm({
        title: "",
        description: "",
        basePrice: "",
        imageUrl: "",
        categoryId: data?.categories[0]?.id ?? "",
        isActive: false,
      });
      return;
    }

    setServiceForm({
      title: selectedService.title,
      description: selectedService.description ?? "",
      basePrice: formatPriceForInput(selectedService.base_price),
      imageUrl: selectedService.image_url ?? "",
      categoryId: selectedService.category_id,
      isActive: selectedService.is_active,
    });
  }, [selectedService, data?.categories]);

  async function handleClientSave() {
    if (!selectedClient) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/cliente/${selectedClient.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientForm),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível atualizar o cliente");
      }

      setFeedback(result.message ?? "Cliente atualizado com sucesso");
      await loadConsoleData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível atualizar o cliente",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClientDelete() {
    if (!selectedClient || !window.confirm("Deseja realmente deletar este cliente?")) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/cliente/${selectedClient.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível deletar o cliente");
      }

      setFeedback(result.message ?? "Cliente removido com sucesso");
      await loadConsoleData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível deletar o cliente",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfessionalSave() {
    if (!selectedProfessional) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const payload = {
        ...professionalForm,
        years_experience:
          professionalForm.years_experience.trim() === ""
            ? null
            : Number(professionalForm.years_experience),
      };

      const response = await fetch(`/api/professional/${selectedProfessional.profile_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível atualizar o prestador");
      }

      setFeedback(result.message ?? "Prestador atualizado com sucesso");
      await loadConsoleData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível atualizar o prestador",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfessionalDelete() {
    if (
      !selectedProfessional ||
      !window.confirm("Deseja realmente deletar este prestador?")
    ) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/professional/${selectedProfessional.profile_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível deletar o prestador");
      }

      setFeedback(result.message ?? "Prestador removido com sucesso");
      await loadConsoleData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível deletar o prestador",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleServiceSave() {
    if (!selectedService) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const digits = serviceForm.basePrice.replace(/\D/g, "");
      const payload = {
        title: serviceForm.title,
        description: serviceForm.description,
        basePrice: digits ? roundCurrencyValue(Number(digits) / 100) : null,
        imageUrl: serviceForm.imageUrl || null,
        categoryId: serviceForm.categoryId,
        isActive: serviceForm.isActive,
      };

      const response = await fetch(`/api/professional-services/${selectedService.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível atualizar o serviço");
      }

      setFeedback(result.message ?? "Serviço atualizado com sucesso");
      await loadConsoleData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível atualizar o serviço",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleServiceDelete() {
    if (!selectedService || !window.confirm("Deseja realmente deletar este serviço?")) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/professional-services/${selectedService.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível deletar o serviço");
      }

      setFeedback(result.message ?? "Serviço removido com sucesso");
      await loadConsoleData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível deletar o serviço",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_24px_80px_rgba(4,22,39,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-navy/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-navy">
            <Shield className="size-3.5" />
            Super admin
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-brand-navy">
            Painel administrativo
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-text-muted">
            Edite e remova clientes, prestadores e serviços usando um fluxo simples
            e direto.
          </p>
        </div>

        {data?.admin ? (
          <div className="rounded-[1.5rem] border border-border/70 bg-surface-frost px-5 py-4 text-sm text-text-muted">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Sessão ativa
            </p>
            <p className="mt-2 font-black text-brand-navy">
              {data.admin.full_name ?? "Administrador"}
            </p>
            <p>{data.admin.email}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          variant={activeTab === "clients" ? "brand" : "surface"}
          className="rounded-2xl"
          onClick={() => setActiveTab("clients")}
        >
          <Users className="size-4" />
          Clientes
        </Button>
        <Button
          type="button"
          variant={activeTab === "professionals" ? "brand" : "surface"}
          className="rounded-2xl"
          onClick={() => setActiveTab("professionals")}
        >
          <BriefcaseBusiness className="size-4" />
          Prestadores
        </Button>
        <Button
          type="button"
          variant={activeTab === "services" ? "brand" : "surface"}
          className="rounded-2xl"
          onClick={() => setActiveTab("services")}
        >
          <Wrench className="size-4" />
          Serviços
        </Button>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-[#ffd3c4] bg-[#fff3ef] px-4 py-3 text-sm font-medium text-[#8a3b18]">
          {errorMessage}
        </div>
      ) : null}

      {feedback ? (
        <div className="mt-6 rounded-2xl border border-brand-peach bg-brand-peach/35 px-4 py-3 text-sm font-medium text-brand-brown">
          {feedback}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-border-soft bg-surface-frost p-10 text-center text-text-muted">
          Carregando painel...
        </div>
      ) : null}

      {!isLoading && activeTab === "clients" ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-[1.75rem] border border-border/70 bg-surface-frost p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Selecionar cliente
            </p>
            <select
              value={selectedClientId}
              onChange={(event) => setSelectedClientId(event.target.value)}
              className="mt-4 h-12 w-full rounded-2xl border border-border/70 bg-white px-4 text-sm font-medium text-brand-navy outline-none"
            >
              {data?.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name ?? "Cliente"} - {client.email}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-[1.75rem] border border-border/70 bg-surface-frost p-5">
            <div className="flex items-center gap-2">
              <UserCog className="size-4 text-brand-navy" />
              <h2 className="text-2xl font-black tracking-[-0.04em] text-brand-navy">
                Alterar cliente
              </h2>
            </div>

            {selectedClient ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input
                  value={clientForm.full_name}
                  onChange={(event) =>
                    setClientForm((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Nome completo"
                />
                <Input
                  type="email"
                  value={clientForm.email}
                  onChange={(event) =>
                    setClientForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Email"
                />
                <Input
                  value={clientForm.phone}
                  onChange={(event) =>
                    setClientForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white md:col-span-2"
                  placeholder="Telefone"
                />

                <div className="mt-2 flex flex-wrap gap-3 md:col-span-2">
                  <Button
                    type="button"
                    variant="brand"
                    className="rounded-2xl"
                    disabled={isSubmitting}
                    onClick={() => void handleClientSave()}
                  >
                    Salvar cliente
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-2xl"
                    disabled={isSubmitting}
                    onClick={() => void handleClientDelete()}
                  >
                    <Trash2 className="size-4" />
                    Deletar cliente
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-text-muted">Nenhum cliente cadastrado.</p>
            )}
          </section>
        </div>
      ) : null}

      {!isLoading && activeTab === "professionals" ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-[1.75rem] border border-border/70 bg-surface-frost p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Selecionar prestador
            </p>
            <select
              value={selectedProfessionalId}
              onChange={(event) => setSelectedProfessionalId(event.target.value)}
              className="mt-4 h-12 w-full rounded-2xl border border-border/70 bg-white px-4 text-sm font-medium text-brand-navy outline-none"
            >
              {data?.professionals.map((professional) => (
                <option key={professional.profile_id} value={professional.profile_id}>
                  {professional.business_name ?? professional.full_name ?? "Prestador"}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-[1.75rem] border border-border/70 bg-surface-frost p-5">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="size-4 text-brand-navy" />
              <h2 className="text-2xl font-black tracking-[-0.04em] text-brand-navy">
                Alterar prestador
              </h2>
            </div>

            {selectedProfessional ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input
                  value={professionalForm.full_name}
                  onChange={(event) =>
                    setProfessionalForm((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Responsável"
                />
                <Input
                  type="email"
                  value={professionalForm.email}
                  onChange={(event) =>
                    setProfessionalForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Email"
                />
                <Input
                  value={professionalForm.phone}
                  onChange={(event) =>
                    setProfessionalForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Telefone"
                />
                <Input
                  value={professionalForm.business_name}
                  onChange={(event) =>
                    setProfessionalForm((current) => ({
                      ...current,
                      business_name: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Nome comercial"
                />
                <Input
                  value={professionalForm.city}
                  onChange={(event) =>
                    setProfessionalForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Cidade"
                />
                <Input
                  value={professionalForm.country}
                  onChange={(event) =>
                    setProfessionalForm((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="País"
                />
                <Input
                  value={professionalForm.years_experience}
                  onChange={(event) =>
                    setProfessionalForm((current) => ({
                      ...current,
                      years_experience: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Anos de experiência"
                />
                <div className="flex items-center gap-6 rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm font-medium text-brand-navy">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={professionalForm.is_verified}
                      onChange={(event) =>
                        setProfessionalForm((current) => ({
                          ...current,
                          is_verified: event.target.checked,
                        }))
                      }
                      className="accent-brand-navy"
                    />
                    Verificado
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={professionalForm.is_insured}
                      onChange={(event) =>
                        setProfessionalForm((current) => ({
                          ...current,
                          is_insured: event.target.checked,
                        }))
                      }
                      className="accent-brand-navy"
                    />
                    Segurado
                  </label>
                </div>
                <textarea
                  value={professionalForm.bio}
                  onChange={(event) =>
                    setProfessionalForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  className="min-h-36 w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm outline-none md:col-span-2"
                  placeholder="Bio"
                />

                <div className="mt-2 flex flex-wrap gap-3 md:col-span-2">
                  <Button
                    type="button"
                    variant="brand"
                    className="rounded-2xl"
                    disabled={isSubmitting}
                    onClick={() => void handleProfessionalSave()}
                  >
                    Salvar prestador
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-2xl"
                    disabled={isSubmitting}
                    onClick={() => void handleProfessionalDelete()}
                  >
                    <Trash2 className="size-4" />
                    Deletar prestador
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-text-muted">
                Nenhum prestador cadastrado.
              </p>
            )}
          </section>
        </div>
      ) : null}

      {!isLoading && activeTab === "services" ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-[1.75rem] border border-border/70 bg-surface-frost p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Selecionar serviço
            </p>
            <select
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
              className="mt-4 h-12 w-full rounded-2xl border border-border/70 bg-white px-4 text-sm font-medium text-brand-navy outline-none"
            >
              {data?.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title} - {service.professional_business_name}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-[1.75rem] border border-border/70 bg-surface-frost p-5">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-brand-navy" />
              <h2 className="text-2xl font-black tracking-[-0.04em] text-brand-navy">
                Alterar serviço
              </h2>
            </div>

            {selectedService ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input
                  value={serviceForm.title}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Título"
                />
                <select
                  value={serviceForm.categoryId}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl border border-border/70 bg-white px-4 text-sm font-medium text-brand-navy outline-none"
                >
                  {data?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Input
                  value={serviceForm.basePrice}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      basePrice: formatCurrencyInput(event.target.value),
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="Valor base"
                />
                <Input
                  value={serviceForm.imageUrl}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      imageUrl: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl bg-white"
                  placeholder="URL da imagem"
                />
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm font-medium text-brand-navy md:col-span-2">
                  <input
                    type="checkbox"
                    checked={serviceForm.isActive}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="accent-brand-navy"
                  />
                  Serviço ativo
                </div>
                <textarea
                  value={serviceForm.description}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-36 w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm outline-none md:col-span-2"
                  placeholder="Descrição"
                />

                <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm text-text-muted md:col-span-2">
                  Prestador vinculado:{" "}
                  <span className="font-semibold text-brand-navy">
                    {selectedService.professional_business_name}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-3 md:col-span-2">
                  <Button
                    type="button"
                    variant="brand"
                    className="rounded-2xl"
                    disabled={isSubmitting}
                    onClick={() => void handleServiceSave()}
                  >
                    Salvar serviço
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-2xl"
                    disabled={isSubmitting}
                    onClick={() => void handleServiceDelete()}
                  >
                    <Trash2 className="size-4" />
                    Deletar serviço
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-text-muted">Nenhum serviço cadastrado.</p>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
