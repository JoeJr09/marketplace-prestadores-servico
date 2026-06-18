import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  getProfessionalServices,
  getServiceById,
} from "@/app/lib/professional-services";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

const createProfessionalServiceSchema = z.object({
  professionalId: z.string().uuid("Id do prestador inválido").optional(),
  categoryId: z.string().uuid("Categoria inválida"),
  title: z.string().trim().min(1, "Informe o título do serviço"),
  description: z
    .string()
    .trim()
    .min(1, "Informe a descrição do serviço"),
  basePrice: z.number().nonnegative("Informe um valor base válido").nullable(),
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

async function resolveProfessionalId(
  requesterId: string,
  role: string,
  professionalId?: string,
) {
  const db = getDatabaseClient();

  if (role === "admin") {
    if (professionalId) {
      return professionalId;
    }

    throw new Error("Informe o prestador para cadastrar o serviço");
  }

  const { data, error } = await db
    .from("professionals")
    .select("id")
    .eq("profile_id", requesterId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Prestador não encontrado");
  }

  return data.id;
}

async function categoryExists(categoryId: string) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function GET(req: NextRequest) {
  try {
    const professionalId = req.nextUrl.searchParams.get("professionalId");

    if (!professionalId) {
      return NextResponse.json(
        {
          error: "professionalId é obrigatório",
        },
        { status: 400 },
      );
    }

    const activeOnly =
      req.nextUrl.searchParams.get("activeOnly") === "1" ||
      req.nextUrl.searchParams.get("activeOnly") === "true";

    const services = await getProfessionalServices(professionalId, {
      activeOnly,
    });

    return NextResponse.json({
      services,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar os serviços",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const requesterId = getAuthenticatedUserId(req);

    if (!requesterId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 },
      );
    }

    const requester = await getAuthenticatedProfile(requesterId);

    if (!["professional", "admin"].includes(requester.role)) {
      return NextResponse.json(
        {
          error: "Apenas prestadores podem cadastrar serviços",
        },
        { status: 403 },
      );
    }

    const parsedBody = createProfessionalServiceSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const professionalId = await resolveProfessionalId(
      requesterId,
      requester.role,
      parsedBody.data.professionalId,
    );

    const categoryIsValid = await categoryExists(parsedBody.data.categoryId);

    if (!categoryIsValid) {
      return NextResponse.json(
        {
          error: "Categoria não encontrada",
        },
        { status: 404 },
      );
    }

    const db = getDatabaseClient();
    const { data, error } = await db
      .from("services")
      .insert({
        professional_id: professionalId,
        category_id: parsedBody.data.categoryId,
        title: parsedBody.data.title,
        description: parsedBody.data.description,
        base_price: parsedBody.data.basePrice,
        image_url: parsedBody.data.imageUrl ?? null,
        is_active: parsedBody.data.isActive ?? true,
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: error?.message ?? "Não foi possível cadastrar o serviço",
        },
        { status: 400 },
      );
    }

    const service = await getServiceById(data.id);

    return NextResponse.json(
      {
        message: "Serviço cadastrado com sucesso",
        service,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível cadastrar o serviço",
      },
      { status: 500 },
    );
  }
}
