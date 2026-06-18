import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyAccessToken } from "@/app/lib/jwt";
import { getServiceById } from "@/app/lib/professional-services";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

const updateProfessionalServiceSchema = z.object({
  categoryId: z.string().uuid("Categoria inválida").optional(),
  title: z.string().trim().min(1, "Informe o título do serviço").optional(),
  description: z
    .string()
    .trim()
    .min(1, "Informe a descrição do serviço")
    .optional(),
  basePrice: z.number().nonnegative("Informe um valor base válido").nullable().optional(),
  imageUrl: z.string().url("Imagem inválida").nullable().optional(),
  isActive: z.boolean().optional(),
});

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

function getAuthenticatedUserId(req: NextRequest) {
  const token = req.cookies.get("sb-access-token")?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyAccessToken(token).id;
  } catch {
    return null;
  }
}

async function getAuthenticatedProfile(userId: string) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Perfil não encontrado");
  }

  return data;
}

async function getProfessionalByProfileId(profileId: string) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("professionals")
    .select("id")
    .eq("profile_id", profileId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id as string;
}

async function canManageService(requesterId: string, role: string, serviceId: string) {
  const service = await getServiceById(serviceId);

  if (!service) {
    return {
      service: null,
      allowed: false,
    };
  }

  if (role === "admin") {
    return {
      service,
      allowed: true,
    };
  }

  const professionalId = await getProfessionalByProfileId(requesterId);

  return {
    service,
    allowed: professionalId === service.professional_id,
  };
}

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const requesterId = getAuthenticatedUserId(req);

    if (!requesterId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const requester = await getAuthenticatedProfile(requesterId);

    if (!["professional", "admin"].includes(requester.role)) {
      return NextResponse.json(
        {
          error: "Apenas prestadores podem editar serviços",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const permission = await canManageService(requesterId, requester.role, id);

    if (!permission.service) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    if (!permission.allowed) {
      return NextResponse.json(
        {
          error: "Sem permissão para editar este serviço",
        },
        { status: 403 },
      );
    }

    const parsedBody = updateProfessionalServiceSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const db = getDatabaseClient();
    const updates: Record<string, string | number | boolean | null> = {};

    if (parsedBody.data.categoryId !== undefined) {
      updates.category_id = parsedBody.data.categoryId;
    }

    if (parsedBody.data.title !== undefined) {
      updates.title = parsedBody.data.title;
    }

    if (parsedBody.data.description !== undefined) {
      updates.description = parsedBody.data.description;
    }

    if (parsedBody.data.basePrice !== undefined) {
      updates.base_price = parsedBody.data.basePrice;
    }

    if (parsedBody.data.imageUrl !== undefined) {
      updates.image_url = parsedBody.data.imageUrl;
    }

    if (parsedBody.data.isActive !== undefined) {
      updates.is_active = parsedBody.data.isActive;
    }

    const { error } = await db
      .from("services")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    const service = await getServiceById(id);

    return NextResponse.json({
      message: "Serviço atualizado com sucesso",
      service,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Não foi possível atualizar o serviço",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const requesterId = getAuthenticatedUserId(req);

    if (!requesterId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const requester = await getAuthenticatedProfile(requesterId);

    if (!["professional", "admin"].includes(requester.role)) {
      return NextResponse.json(
        {
          error: "Apenas prestadores podem remover serviços",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const permission = await canManageService(requesterId, requester.role, id);

    if (!permission.service) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    if (!permission.allowed) {
      return NextResponse.json(
        {
          error: "Sem permissão para remover este serviço",
        },
        { status: 403 },
      );
    }

    const db = getDatabaseClient();
    const { error } = await db.from("services").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Serviço removido com sucesso",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Não foi possível remover o serviço",
      },
      { status: 500 },
    );
  }
}
