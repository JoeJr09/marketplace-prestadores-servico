import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyAccessToken } from "@/app/lib/jwt";
import { getServiceById } from "@/app/lib/professional-services";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

const createServiceRequestSchema = z.object({
  professionalId: z.string().uuid("Id invalido"),
  serviceId: z.string().uuid("Servico invalido"),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida"),
  serviceTime: z.string().regex(/^\d{2}:\d{2}$/, "Horario invalido"),
});

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

function getAuthenticatedUserId(req: NextRequest) {
  const token = req.cookies.get("sb-access-token")?.value;

  if (!token) {
    return null;
  }

  return verifyAccessToken(token).id;
}

async function getAuthenticatedProfile(userId: string) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Perfil nao encontrado");
  }

  return data;
}

function buildServiceDateTime(serviceDate: string, serviceTime: string) {
  return `${serviceDate}T${serviceTime}:00`;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Nao autenticado",
        },
        { status: 401 },
      );
    }

    const profile = await getAuthenticatedProfile(userId);

    if (profile.role !== "client") {
      return NextResponse.json(
        {
          error: "Apenas clientes podem solicitar orcamentos",
        },
        { status: 403 },
      );
    }

    const parsedBody = createServiceRequestSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados invalidos",
          details: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { professionalId, serviceId, serviceDate, serviceTime } =
      parsedBody.data;
    const db = getDatabaseClient();
    const dateService = buildServiceDateTime(serviceDate, serviceTime);
    const service = await getServiceById(serviceId);

    if (!service) {
      return NextResponse.json(
        {
          error: "Servico nao encontrado",
        },
        { status: 404 },
      );
    }

    if (service.professional_id !== professionalId) {
      return NextResponse.json(
        {
          error: "Esse servico nao pertence ao prestador selecionado",
        },
        { status: 400 },
      );
    }

    if (!service.is_active) {
      return NextResponse.json(
        {
          error: "Esse servico nao esta disponivel para solicitacao",
        },
        { status: 409 },
      );
    }

    const { data: acceptedConflict, error: acceptedConflictError } = await db
      .from("calendar")
      .select("id")
      .eq("id_professional", professionalId)
      .eq("date_service", dateService)
      .eq("status", "ACEITA")
      .maybeSingle();

    if (acceptedConflictError) {
      return NextResponse.json(
        {
          error: acceptedConflictError.message,
        },
        { status: 400 },
      );
    }

    if (acceptedConflict) {
      return NextResponse.json(
        {
          error: "Esse horario ja esta indisponivel",
        },
        { status: 409 },
      );
    }

    const { data: existingPendingRequest, error: existingPendingRequestError } =
      await db
        .from("calendar")
        .select("id")
        .eq("id_professional", professionalId)
        .eq("id_cliente", userId)
        .eq("date_service", dateService)
        .eq("status", "PENDENTE")
        .maybeSingle();

    if (existingPendingRequestError) {
      return NextResponse.json(
        {
          error: existingPendingRequestError.message,
        },
        { status: 400 },
      );
    }

    if (existingPendingRequest) {
      return NextResponse.json(
        {
          error: "Voce ja possui uma solicitacao pendente para esse horario",
        },
        { status: 409 },
      );
    }

    const { data, error } = await db
      .from("calendar")
      .insert({
        id_professional: professionalId,
        id_cliente: userId,
        id_service: serviceId,
        date_service: dateService,
        status: "PENDENTE",
      })
      .select(
        "id, created_at, id_professional, id_cliente, id_service, date_service, status",
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: error?.message ?? "Nao foi possivel criar a solicitacao",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Solicitacao enviada com sucesso",
        request: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Nao foi possivel enviar a solicitacao",
      },
      { status: 500 },
    );
  }
}
