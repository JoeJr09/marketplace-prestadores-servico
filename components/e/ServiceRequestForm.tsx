"use client";

import { type FormEvent, useMemo, useState } from "react";
import { CalendarDays, Clock3, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ServiceRequestFormProps = {
  professionalId: string;
  serviceId: string;
  serviceTitle: string;
  unavailableSlots: string[];
};

const timeOptions = Array.from({ length: 11 }, (_, index) => {
  const hour = index + 8;
  return `${String(hour).padStart(2, "0")}:00`;
});

function toLocalDateLabel(dateValue: string) {
  const [year, month, day] = dateValue.split("-");

  if (!year || !month || !day) {
    return "";
  }

  return `${day}/${month}/${year}`;
}

export function ServiceRequestForm({
  professionalId,
  serviceId,
  serviceTitle,
  unavailableSlots,
}: ServiceRequestFormProps) {
  const minServiceDate = new Date().toISOString().slice(0, 10);
  const [isOpen, setIsOpen] = useState(false);
  const [serviceDate, setServiceDate] = useState("");
  const [serviceTime, setServiceTime] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unavailableTimesForDate = useMemo(() => {
    if (!serviceDate) {
      return [];
    }

    return unavailableSlots
      .filter((slot) => slot.startsWith(serviceDate))
      .map((slot) => slot.slice(11, 16));
  }, [serviceDate, unavailableSlots]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPending(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalId,
          serviceId,
          serviceDate,
          serviceTime,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Nao foi possivel enviar a solicitacao",
        );
      }

      setMessage(data.message ?? "Solicitacao enviada com sucesso");
      setServiceDate("");
      setServiceTime("");
      setIsOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar a solicitacao",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <Button
        type="button"
        variant="brand"
        size="xl"
        className="rounded-md"
        onClick={() => setIsOpen((current) => !current)}
      >
        Solicitar este servico
      </Button>

      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-[1.75rem] border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_rgba(4,22,39,0.08)]"
        >
          <div className="flex items-center gap-3">
            <ReceiptText className="size-5 text-brand-navy" />
            <div>
              <p className="text-lg font-black tracking-[-0.03em] text-brand-navy">
                Solicitar atendimento
              </p>
              <p className="text-sm text-text-muted">
                Agende um horario para o servico {serviceTitle}.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-surface-muted/80 px-4 py-3 text-sm text-brand-steel-deep">
            <p>
              Servico selecionado:{" "}
              <span className="font-black text-brand-navy">{serviceTitle}</span>
            </p>
            {serviceDate ? (
              <p className="mt-1">
                Data escolhida:{" "}
                <span className="font-black text-brand-navy">
                  {toLocalDateLabel(serviceDate)}
                  {serviceTime ? ` as ${serviceTime}` : ""}
                </span>
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                <CalendarDays className="size-3.5" />
                Dia
              </span>
              <Input
                type="date"
                value={serviceDate}
                min={minServiceDate}
                lang="pt-BR"
                onChange={(event) => {
                  setServiceDate(event.target.value);
                  setServiceTime("");
                }}
                className="h-12 rounded-2xl border-border/70 bg-surface-muted"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                <Clock3 className="size-3.5" />
                Hora
              </span>
              <select
                value={serviceTime}
                onChange={(event) => setServiceTime(event.target.value)}
                className="h-12 w-full rounded-2xl border border-border/70 bg-surface-muted px-4 text-sm font-medium text-brand-navy outline-none focus:ring-2 focus:ring-brand-navy/15"
                required
              >
                <option value="">Selecione</option>
                {timeOptions.map((timeOption) => {
                  const unavailable = unavailableTimesForDate.includes(timeOption);

                  return (
                    <option
                      key={timeOption}
                      value={timeOption}
                      disabled={unavailable}
                    >
                      {unavailable ? `${timeOption} - indisponivel` : timeOption}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          {serviceDate && unavailableTimesForDate.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-brand-orange/20 bg-brand-orange/8 px-4 py-3 text-sm text-brand-brown">
              Horarios indisponiveis neste dia:{" "}
              <span className="font-semibold">
                {unavailableTimesForDate.join(", ")}
              </span>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 text-sm font-medium text-brand-orange">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="submit"
              variant="brand"
              className="rounded-md"
              disabled={pending}
            >
              {pending ? "Enviando..." : "Enviar solicitacao"}
            </Button>
            <Button
              type="button"
              variant="surface"
              className="rounded-md"
              onClick={() => setIsOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm font-medium text-brand-brown">{message}</p>
      ) : null}
    </div>
  );
}
