"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

import { InputPhone } from "@/components/e/InputPhone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EditSettingsPanelProps = {
  client: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  startInEditMode?: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EditSettingsPanel({
  client,
  startInEditMode = false,
}: EditSettingsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    client.avatar_url
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: client.full_name,
    email: client.email,
    phone: client.phone ?? "",
    avatar_url: client.avatar_url ?? "",
    password: "",
  });

  function resetFormState() {
    setFormData({
      full_name: client.full_name,
      email: client.email,
      phone: client.phone ?? "",
      avatar_url: client.avatar_url ?? "",
      password: "",
    });
    setAvatarPreview(client.avatar_url);
    setDeleteName("");
    setError(null);
    setMessage(null);
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview local imediato
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

      if (!response.ok) {
        setError(data.error ?? "Erro ao fazer upload da imagem.");
        setAvatarPreview(client.avatar_url);
        return;
      }

      setFormData((current) => ({
        ...current,
        avatar_url: data.url ?? "",
      }));
    } catch {
      setError("Erro ao fazer upload da imagem.");
      setAvatarPreview(client.avatar_url);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar as alterações.");
        return;
      }

      setMessage(data.message ?? "Dados atualizados com sucesso.");
      router.push(`/cliente/${client.id}`);
      router.refresh();
    });
  }

  const canDelete = deleteName.trim() === client.full_name;

  async function handleDeleteAccount() {
    setMessage(null);
    setError(null);

    if (!canDelete) {
      setError(
        "Digite seu nome completo exatamente como está no perfil para confirmar a exclusão."
      );
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/me", { method: "DELETE" });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível excluir a conta.");
        return;
      }

      router.push("/cliente");
      router.refresh();
    });
  }

  return (
    <aside className="rounded-[2rem] border border-white/70 bg-white/60 p-8 shadow-[0_20px_70px_rgba(4,22,39,0.08)] backdrop-blur sm:p-10">
      {!isEditing ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                Área da conta
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-navy">
                Dados da conta
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                O padrão mais comum é mostrar um resumo limpo e abrir o
                formulário completo apenas quando a pessoa decide editar.
              </p>
            </div>

            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => {
                setError(null);
                setMessage(null);
                setIsEditing(true);
              }}
            >
              Editar perfil
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-border bg-surface-plain p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                Campos disponíveis
              </p>
              <p className="mt-3 text-base leading-7 text-text-muted">
                Nome completo, email, telefone, imagem de perfil e senha.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-surface-plain p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                Exclusão segura
              </p>
              <p className="mt-3 text-base leading-7 text-text-muted">
                Se algum dia você quiser apagar a conta, será preciso confirmar
                digitando o nome completo para evitar ações por engano.
              </p>
            </div>
          </div>

          {message ? (
            <p className="rounded-xl bg-brand-peach/50 px-4 py-3 text-sm font-medium text-brand-brown">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                Edição de conta
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-brand-navy">
                Editar dados da conta
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Formulário direto, com campos bem distribuídos e ações claras de
                salvar ou cancelar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="surface"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  resetFormState();
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="account-settings-form"
                variant="brand"
                size="sm"
                disabled={isPending || isUploadingAvatar}
              >
                {isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>

          <form
            id="account-settings-form"
            className="mt-8 grid gap-5"
            onSubmit={handleSubmit}
          >
            {/* Upload de foto */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle">
                Foto de perfil
              </p>

              <div className="flex items-center gap-5">
                {/* Preview do avatar */}
                <div className="relative h-20 w-20 shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Foto de perfil"
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#dee4e3_0%,#cbd5e1_48%,#94a3b8_100%)] text-xl font-black text-brand-navy">
                      {getInitials(formData.full_name || client.full_name)}
                    </div>
                  )}

                  {isUploadingAvatar ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  ) : null}
                </div>

                {/* Botão de upload */}
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
                  htmlFor="full_name"
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
                >
                  Nome completo
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

              <div className="space-y-2 sm:col-span-2">
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
                  placeholder="Deixe em branco para manter a atual"
                />
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

          <div className="mt-8 rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-sm">
                <h3 className="text-lg font-black tracking-[-0.03em] text-destructive">
                  Excluir conta
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Para evitar erros, confirme a exclusão digitando seu nome
                  completo exatamente como aparece no perfil.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending || !canDelete}
                onClick={handleDeleteAccount}
              >
                {isPending ? "Excluindo..." : "Deletar conta"}
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <label
                htmlFor="delete_name"
                className="text-xs font-semibold uppercase tracking-[0.22em] text-text-subtle"
              >
                Confirme com seu nome completo
              </label>
              <Input
                id="delete_name"
                value={deleteName}
                onChange={(event) => setDeleteName(event.target.value)}
                className="h-12 rounded-2xl border-destructive/20 bg-white/80 px-4"
                placeholder={client.full_name}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}