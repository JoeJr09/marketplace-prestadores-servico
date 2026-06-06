"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { InputPhone } from "@/components/e/InputPhone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeBusinessName } from "@/app/lib/professional-slug";

type ProfessionalProfileSettingsPanelProps = {
  professional: {
    profile: {
      full_name: string | null;
      email: string;
      phone: string | null;
      avatar_url: string | null;
    };
    business_name: string;
    bio: string | null;
    years_experience: number | null;
    city: string | null;
    country: string | null;
    is_insured: boolean;
  };
};

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

export function ProfessionalProfileSettingsPanel({
  professional,
}: ProfessionalProfileSettingsPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    professional.profile.avatar_url,
  );
  const [formData, setFormData] = useState({
    full_name: professional.profile.full_name ?? "",
    email: professional.profile.email,
    phone: professional.profile.phone ?? "",
    avatar_url: professional.profile.avatar_url ?? "",
    business_name: professional.business_name,
    bio: professional.bio ?? "",
    years_experience: String(professional.years_experience ?? ""),
    city: professional.city ?? "",
    country: professional.country ?? "",
    is_insured: professional.is_insured,
    password: "",
  });

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setError(null);
    setIsUploadingAvatar(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("bucket", "avatars");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Erro ao fazer upload da imagem.");
        setAvatarPreview(professional.profile.avatar_url);
        return;
      }

      setFormData((current) => ({
        ...current,
        avatar_url: data.url ?? "",
      }));
    } catch {
      setError("Erro ao fazer upload da imagem.");
      setAvatarPreview(professional.profile.avatar_url);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const businessName = normalizeBusinessName(formData.business_name);

    if (!businessName) {
      setError("Informe um nome de empresa válido.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/me/professional", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          business_name: businessName,
          years_experience: formData.years_experience
            ? Number(formData.years_experience)
            : null,
          password: formData.password || undefined,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar as alterações.");
        return;
      }

      setMessage(data.message ?? "Perfil atualizado com sucesso.");
      router.push(`/prestador/${businessName}`);
      router.refresh();
    });
  }

  const normalizedPreview = normalizeBusinessName(formData.business_name);

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/65 p-7 shadow-[0_20px_70px_rgba(4,22,39,0.08)] backdrop-blur sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
            Perfil de prestador
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-brand-navy">
            Editar dados profissionais
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            O nome da empresa vira a URL pública:
            <span className="ml-1 font-semibold text-brand-navy">
              /prestador/{normalizedPreview || "nome-da-empresa"}
            </span>
          </p>
        </div>
        <Button
          type="submit"
          form="professional-profile-form"
          variant="brand"
          size="lg"
          className="rounded-2xl"
          disabled={isPending || isUploadingAvatar}
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <form
        id="professional-profile-form"
        className="mt-8 grid gap-6"
        onSubmit={handleSubmit}
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
            Foto de perfil
          </p>
          <div className="flex items-center gap-5">
            <div className="relative size-24 shrink-0">
              {avatarPreview ? (
                <div
                  role="img"
                  aria-label="Foto de perfil"
                  className="size-24 rounded-2xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${avatarPreview})`,
                  }}
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#dee4e3_0%,#cbd5e1_48%,#94a3b8_100%)] text-xl font-black text-brand-navy">
                  {getInitials(formData.business_name || formData.full_name)}
                </div>
              )}
              {isUploadingAvatar ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                  <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="surface"
                size="sm"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingAvatar ? "Enviando..." : "Escolher foto"}
              </Button>
              <p className="text-xs text-text-subtle">
                JPEG, PNG, WEBP ou GIF. Máximo 5MB.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label
              htmlFor="business_name"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              Nome da empresa
            </label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  business_name: normalizeBusinessName(event.target.value),
                }))
              }
              className="h-12 rounded-2xl border-border bg-white/80 px-4"
              placeholder="minha-empresa"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="full_name"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              Nome do responsável
            </label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  full_name: event.target.value,
                }))
              }
              className="h-12 rounded-2xl border-border bg-white/80 px-4"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="h-12 rounded-2xl border-border bg-white/80 px-4"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              Telefone
            </label>
            <InputPhone
              id="phone"
              value={formData.phone}
              onChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  phone: value,
                }))
              }
              className="h-12 rounded-2xl border-border bg-white/80 px-4"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="years_experience"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              Anos de experiência
            </label>
            <Input
              id="years_experience"
              type="number"
              min={0}
              max={80}
              value={formData.years_experience}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  years_experience: event.target.value,
                }))
              }
              className="h-12 rounded-2xl border-border bg-white/80 px-4"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="city"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              Cidade
            </label>
            <Input
              id="city"
              value={formData.city}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  city: event.target.value,
                }))
              }
              className="h-12 rounded-2xl border-border bg-white/80 px-4"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="country"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              País
            </label>
            <Input
              id="country"
              value={formData.country}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  country: event.target.value,
                }))
              }
              className="h-12 rounded-2xl border-border bg-white/80 px-4"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              Nova senha
            </label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="h-12 rounded-2xl border-border bg-white/80 px-4"
              placeholder="Deixe em branco para manter"
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm font-semibold text-brand-navy">
            <input
              type="checkbox"
              checked={formData.is_insured}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  is_insured: event.target.checked,
                }))
              }
              className="size-4 accent-brand-navy"
            />
            Possui seguro
          </label>

          <div className="space-y-2 sm:col-span-2">
            <label
              htmlFor="bio"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
            >
              Descrição
            </label>
            <textarea
              id="bio"
              rows={5}
              value={formData.bio}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
              className="w-full resize-none rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-brand-navy/20"
              maxLength={500}
            />
            <p className="text-right text-xs text-text-subtle">
              {formData.bio.length}/500
            </p>
          </div>
        </div>
      </form>

      {message ? (
        <p className="mt-5 rounded-xl bg-brand-peach/50 px-4 py-3 text-sm font-medium text-brand-brown">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
