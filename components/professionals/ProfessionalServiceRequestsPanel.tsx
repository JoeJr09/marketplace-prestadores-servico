"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileText,
  ReceiptText,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  ProfessionalDashboardProfile,
  ServiceRequestCard,
} from "@/components/professionals/service-management.types";

type ProfessionalServiceRequestsPanelProps = {
  professional: ProfessionalDashboardProfile;
  requests: ServiceRequestCard[];
  onRequestsChange: Dispatch<SetStateAction<ServiceRequestCard[]>>;
};

function formatDateTime(value: string) {
  const parsedDate = new Date(value);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
}

function getStatusLabel(status: ServiceRequestCard["status"]) {
  if (status === "ACEITA") {
    return "Aceita";
  }

  if (status === "RECUSADA") {
    return "Recusada";
  }

  if (status === "CONCLUIDA") {
    return "Concluida";
  }

  if (status === "ABORTADA") {
    return "Abortada";
  }

  return "Pendente";
}

function getStatusClassName(status: ServiceRequestCard["status"]) {
  if (status === "ACEITA") {
    return "bg-brand-peach text-brand-brown";
  }

  if (status === "RECUSADA") {
    return "bg-brand-orange/12 text-brand-orange";
  }

  if (status === "CONCLUIDA") {
    return "bg-brand-navy text-white";
  }

  if (status === "ABORTADA") {
    return "bg-brand-steel-mid text-white";
  }

  return "bg-brand-navy text-white";
}

export function ProfessionalServiceRequestsPanel({
  professional,
  requests,
  onRequestsChange,
}: ProfessionalServiceRequestsPanelProps) {
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingCount = requests.filter(
    (request) => request.status === "PENDENTE" || request.status === "ACEITA",
  ).length;

  async function updateRequest(
    requestId: string,
    action: "accept" | "reject" | "complete" | "abort",
  ) {
    setErrorMessage(null);
    setPendingIds((currentPendingIds) => [...currentPendingIds, requestId]);

    try {
      const response = await fetch(`/api/service-requests/${requestId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        request?: {
          id: string;
          status: ServiceRequestCard["status"];
          date_service: string;
        };
      };

      if (!response.ok || !data.request) {
        throw new Error(
          data.error ?? "Nao foi possivel atualizar a solicitacao",
        );
      }

      onRequestsChange((currentRequests) =>
        currentRequests.map((request) => {
          if (request.id === requestId) {
            return {
              ...request,
              status: data.request!.status,
            };
          }

          if (
            action === "accept" &&
            request.status === "PENDENTE" &&
            request.date_service === data.request.date_service
          ) {
            return {
              ...request,
              status: "RECUSADA",
            };
          }

          return request;
        }),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar a solicitacao",
      );
    } finally {
      setPendingIds((currentPendingIds) =>
        currentPendingIds.filter((pendingId) => pendingId !== requestId),
      );
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(4,22,39,0.08)]">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">
            Portal do prestador
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-brand-navy">
            Solicitações recebidas
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Pedidos enviados para{" "}
            {professional.business_name ??
              professional.profile.full_name ??
              "este prestador"}
            .
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-steel-deep">
          {pendingCount} pendentes
        </p>
      </div>

      {errorMessage ? (
        <p className="mt-5 text-sm font-medium text-brand-orange">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5">
        {requests.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border-soft bg-surface-frost p-6 text-center">
            <FileText className="mx-auto size-7 text-brand-slate" />
            <p className="mt-4 text-lg font-black tracking-[-0.03em] text-brand-steel-deep">
              Nenhuma solicitacao por enquanto
            </p>
            <p className="mt-2 text-sm leading-7 text-text-muted">
              Quando um cliente enviar um horario, ele aparecera aqui para
              aceite ou recusa.
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <article
              key={request.id}
              className="rounded-[1.75rem] border border-border/70 bg-surface-frost p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                    <UserRound className="size-3.5" />
                    Cliente
                  </div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-brand-navy">
                    {request.client_name}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    {request.client_email}
                  </p>
                </div>

                <span
                  className={[
                    "inline-flex w-max rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em]",
                    getStatusClassName(request.status),
                  ].join(" ")}
                >
                  {getStatusLabel(request.status)}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/70 p-4 md:col-span-1">
                  <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                    <ReceiptText className="size-3.5" />
                    Servico
                  </p>
                  <p className="mt-2 text-lg font-black text-brand-navy">
                    {request.service_title ?? "Servico nao identificado"}
                  </p>
                  {request.service_category_name ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                      {request.service_category_name}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                    <CalendarDays className="size-3.5" />
                    Agendamento
                  </p>
                  <p className="mt-2 text-lg font-black text-brand-navy">
                    {formatDateTime(request.date_service)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                    <Clock3 className="size-3.5" />
                    Solicitado em
                  </p>
                  <p className="mt-2 text-lg font-black text-brand-navy">
                    {formatDateTime(request.created_at)}
                  </p>
                </div>
              </div>

              {request.status === "PENDENTE" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="brand"
                    className="rounded-md"
                    disabled={pendingIds.includes(request.id)}
                    onClick={() => void updateRequest(request.id, "accept")}
                  >
                    Aceitar
                  </Button>
                  <Button
                    type="button"
                    variant="surface"
                    className="rounded-md"
                    disabled={pendingIds.includes(request.id)}
                    onClick={() => void updateRequest(request.id, "reject")}
                  >
                    Recusar
                  </Button>
                </div>
              ) : null}

              {request.status === "ACEITA" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="brand"
                    className="rounded-md"
                    disabled={pendingIds.includes(request.id)}
                    onClick={() => void updateRequest(request.id, "complete")}
                  >
                    Concluir
                  </Button>
                  <Button
                    type="button"
                    variant="surface"
                    className="rounded-md"
                    disabled={pendingIds.includes(request.id)}
                    onClick={() => void updateRequest(request.id, "abort")}
                  >
                    Abortar
                  </Button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
