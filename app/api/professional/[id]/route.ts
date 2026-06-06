import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import { normalizeBusinessName } from "@/app/lib/professional-slug";
import {
  professionalIdSchema,
  updateProfessionalSchema,
} from "@/app/types/professional";

const professionalDetailSelect = `
  id,
  full_name,
  email,
  phone,
  avatar_url,
  role,
  created_at,
  updated_at,
  professionals!inner (
    id,
    profile_id,
    business_name,
    bio,
    years_experience,
    city,
    country,
    location,
    is_verified,
    is_insured,
    tier_label,
    profile_strength,
    avg_rating,
    total_reviews,
    avg_response_hours,
    plan_id,
    created_at,
    updated_at
  )
`;

const adminOnlyFields = [
  "profile_id",
  "is_verified",
  "tier_label",
  "profile_strength",
  "avg_rating",
  "total_reviews",
  "avg_response_hours",
  "plan_id",
  "location",
] as const;

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function businessNameExists(
  businessName: string,
  exceptProfileId?: string,
) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("professionals")
    .select("profile_id, business_name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).some((professional) => {
    if (professional.profile_id === exceptProfileId) {
      return false;
    }

    return (
      normalizeBusinessName(professional.business_name ?? "") === businessName
    );
  });
}

function getTokenFromRequest(
  req: NextRequest,
) {
  return req.cookies.get(
    "sb-access-token",
  )?.value;
}

function getAuthenticatedUserId(
  req: NextRequest,
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return verifyAccessToken(token).id;
}

async function parseJsonBody(
  req: NextRequest,
) {
  const body = await req.text();

  if (!body.trim()) {
    return {};
  }

  try {
    return JSON.parse(body) as Record<
      string,
      unknown
    >;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

async function getRequesterProfile(
  requesterId: string,
) {
  const db = getDatabaseClient();
  const {
    data: profile,
    error,
  } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", requesterId)
    .single();

  if (error || !profile) {
    throw new Error(
      error?.message ||
        "Perfil autenticado nao encontrado",
    );
  }

  return profile;
}

async function getProfessionalProfileById(
  profileId: string,
) {
  const db = getDatabaseClient();
  const {
    data: profile,
    error,
  } = await db
    .from("profiles")
    .select(professionalDetailSelect)
    .eq("id", profileId)
    .eq("role", "professional")
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

function getPermissions(args: {
  requesterId: string | null;
  requesterRole: string | null;
  professionalId: string;
}) {
  const isOwner =
    args.requesterId ===
    args.professionalId;
  const isAdmin =
    args.requesterRole === "admin";
  const canManage = isOwner || isAdmin;

  return {
    can_view_contact_phone: canManage,
    can_update_professional: canManage,
    can_delete_account: canManage,
    is_owner: isOwner,
    is_admin: isAdmin,
  };
}

function normalizeProfessionalProfile(
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
    updated_at: string;
    professionals:
      | Record<string, unknown>
      | Record<string, unknown>[];
  },
) {
  const professional = Array.isArray(
    profile.professionals,
  )
    ? profile.professionals[0]
    : profile.professionals;

  return {
    ...professional,
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    },
  };
}

function sanitizeProfessionalProfile(args: {
  professional: Awaited<
    ReturnType<
      typeof getProfessionalProfileById
    >
  >;
  canViewPhone: boolean;
}) {
  if (!args.professional) {
    return null;
  }

  const normalized =
    normalizeProfessionalProfile(
      args.professional,
    );

  if (args.canViewPhone) {
    return normalized;
  }

  return {
    ...normalized,
    profile: {
      ...normalized.profile,
      phone: null,
    },
  };
}

async function updateProfessional(
  req: NextRequest,
  id: string,
) {
  try {
    const requesterId =
      getAuthenticatedUserId(req);

    if (!requesterId) {
      return NextResponse.json(
        {
          error: "Nao autenticado",
        },
        { status: 401 },
      );
    }

    const requester =
      await getRequesterProfile(
        requesterId,
      );

    const canManage =
      requesterId === id ||
      requester.role === "admin";

    if (!canManage) {
      return NextResponse.json(
        {
          error:
            "Sem permissao para alterar este professional",
        },
        { status: 403 },
      );
    }

    const professional =
      await getProfessionalProfileById(id);

    if (!professional) {
      return NextResponse.json(
        {
          error:
            "Professional nao encontrado",
        },
        { status: 404 },
      );
    }

    const parsedBody =
      updateProfessionalSchema.safeParse(
        await parseJsonBody(req),
      );

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados invalidos",
          details:
            parsedBody.error.flatten()
              .fieldErrors,
        },
        { status: 400 },
      );
    }

    const restrictedFields =
      adminOnlyFields.filter(
        (field) =>
          parsedBody.data[field] !==
          undefined,
      );

    if (
      requester.role !== "admin" &&
      restrictedFields.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Alguns campos so podem ser alterados por admin",
          details: restrictedFields,
        },
        { status: 403 },
      );
    }

    const {
      full_name,
      email,
      password,
      phone,
      avatar_url,
      business_name,
      bio,
      years_experience,
      city,
      country,
      is_insured,
      is_verified,
      tier_label,
      profile_strength,
      avg_rating,
      total_reviews,
      avg_response_hours,
      plan_id,
      location,
    } = parsedBody.data;

    if (
      (email || password) &&
      !supabaseAdmin
    ) {
      return NextResponse.json(
        {
          error:
            "Para alterar email ou senha, configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 503 },
      );
    }

    if (
      supabaseAdmin &&
      (email || password)
    ) {
      const { error } =
        await supabaseAdmin.auth.admin.updateUserById(
          id,
          {
            email,
            password,
            user_metadata:
              full_name !== undefined
                ? { full_name }
                : undefined,
          },
        );

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 },
        );
      }
    }

    const profileUpdates: Record<
      string,
      string | null
    > = {};

    if (full_name !== undefined) {
      profileUpdates.full_name =
        full_name;
    }

    if (email !== undefined) {
      profileUpdates.email = email;
    }

    if (phone !== undefined) {
      profileUpdates.phone = phone;
    }

    if (avatar_url !== undefined) {
      profileUpdates.avatar_url =
        avatar_url;
    }

    if (
      Object.keys(profileUpdates).length > 0
    ) {
      const db = getDatabaseClient();
      const {
        error: profileError,
      } = await db
        .from("profiles")
        .update(profileUpdates)
        .eq("id", id)
        .eq("role", "professional");

      if (profileError) {
        return NextResponse.json(
          {
            error: profileError.message,
          },
          { status: 400 },
        );
      }
    }

    const professionalUpdates: Record<
      string,
      string | number | boolean | null
    > = {};

    if (business_name !== undefined) {
      const normalizedBusinessName =
        business_name === null ? null : normalizeBusinessName(business_name);

      if (!normalizedBusinessName) {
        return NextResponse.json(
          {
            error: "Nome da empresa inválido",
          },
          { status: 400 },
        );
      }

      if (await businessNameExists(normalizedBusinessName, id)) {
        return NextResponse.json(
          {
            error: "Já existe um prestador com este nome de empresa",
          },
          { status: 409 },
        );
      }

      professionalUpdates.business_name = normalizedBusinessName;
    }

    if (bio !== undefined) {
      professionalUpdates.bio = bio;
    }

    if (
      years_experience !== undefined
    ) {
      professionalUpdates.years_experience =
        years_experience;
    }

    if (city !== undefined) {
      professionalUpdates.city = city;
    }

    if (country !== undefined) {
      professionalUpdates.country =
        country;
    }

    if (is_insured !== undefined) {
      professionalUpdates.is_insured =
        is_insured;
    }

    if (
      requester.role === "admin"
    ) {
      if (is_verified !== undefined) {
        professionalUpdates.is_verified =
          is_verified;
      }

      if (tier_label !== undefined) {
        professionalUpdates.tier_label =
          tier_label;
      }

      if (
        profile_strength !== undefined
      ) {
        professionalUpdates.profile_strength =
          profile_strength;
      }

      if (avg_rating !== undefined) {
        professionalUpdates.avg_rating =
          avg_rating;
      }

      if (
        total_reviews !== undefined
      ) {
        professionalUpdates.total_reviews =
          total_reviews;
      }

      if (
        avg_response_hours !==
        undefined
      ) {
        professionalUpdates.avg_response_hours =
          avg_response_hours;
      }

      if (plan_id !== undefined) {
        professionalUpdates.plan_id =
          plan_id;
      }

      if (location !== undefined) {
        professionalUpdates.location =
          location;
      }
    }

    if (
      Object.keys(
        professionalUpdates,
      ).length > 0
    ) {
      const db = getDatabaseClient();
      const {
        error: professionalError,
      } = await db
        .from("professionals")
        .update(professionalUpdates)
        .eq("profile_id", id);

      if (professionalError) {
        return NextResponse.json(
          {
            error:
              professionalError.message,
          },
          { status: 400 },
        );
      }
    }

    const updatedProfessional =
      await getProfessionalProfileById(id);

    const permissions =
      getPermissions({
        requesterId,
        requesterRole: requester.role,
        professionalId: id,
      });

    return NextResponse.json({
      message:
        "Professional atualizado com sucesso",
      professional:
        sanitizeProfessionalProfile({
          professional:
            updatedProfessional,
          canViewPhone:
            permissions.can_view_contact_phone,
        }),
      permissions,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_JSON"
    ) {
      return NextResponse.json(
        {
          error: "JSON invalido",
        },
        { status: 400 },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        error: "Token invalido",
      },
      { status: 401 },
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const { id } = await ctx.params;
    const parsedId =
      professionalIdSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        {
          error: "Id invalido",
        },
        { status: 400 },
      );
    }

    const requesterId =
      getAuthenticatedUserId(req);
    const requester = requesterId
      ? await getRequesterProfile(
          requesterId,
        )
      : null;
    const professional =
      await getProfessionalProfileById(
        parsedId.data,
      );

    if (!professional) {
      return NextResponse.json(
        {
          error:
            "Professional nao encontrado",
        },
        { status: 404 },
      );
    }

    const permissions =
      getPermissions({
        requesterId,
        requesterRole:
          requester?.role ?? null,
        professionalId: parsedId.data,
      });

    return NextResponse.json({
      professional:
        sanitizeProfessionalProfile({
          professional,
          canViewPhone:
            permissions.can_view_contact_phone,
        }),
      permissions,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_JSON"
    ) {
      return NextResponse.json(
        {
          error: "JSON invalido",
        },
        { status: 400 },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        error: "Token invalido",
      },
      { status: 401 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await ctx.params;
  const parsedId =
    professionalIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json(
      {
        error: "Id invalido",
      },
      { status: 400 },
    );
  }

  return updateProfessional(
    req,
    parsedId.data,
  );
}

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await ctx.params;
  const parsedId =
    professionalIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json(
      {
        error: "Id invalido",
      },
      { status: 400 },
    );
  }

  return updateProfessional(
    req,
    parsedId.data,
  );
}

export async function DELETE(
  req: NextRequest,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const requesterId =
      getAuthenticatedUserId(req);

    if (!requesterId) {
      return NextResponse.json(
        {
          error: "Nao autenticado",
        },
        { status: 401 },
      );
    }

    const { id } = await ctx.params;
    const parsedId =
      professionalIdSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        {
          error: "Id invalido",
        },
        { status: 400 },
      );
    }

    const requester =
      await getRequesterProfile(
        requesterId,
      );

    const canManage =
      requesterId === parsedId.data ||
      requester.role === "admin";

    if (!canManage) {
      return NextResponse.json(
        {
          error:
            "Sem permissao para apagar este professional",
        },
        { status: 403 },
      );
    }

    const professional =
      await getProfessionalProfileById(
        parsedId.data,
      );

    if (!professional) {
      return NextResponse.json(
        {
          error:
            "Professional nao encontrado",
        },
        { status: 404 },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Para apagar professionals, configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 503 },
      );
    }

    const {
      error: professionalError,
    } = await supabaseAdmin
      .from("professionals")
      .delete()
      .eq("profile_id", parsedId.data);

    if (professionalError) {
      return NextResponse.json(
        {
          error:
            professionalError.message,
        },
        { status: 400 },
      );
    }

    const {
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", parsedId.data)
      .eq("role", "professional");

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 400 },
      );
    }

    const {
      error: authError,
    } = await supabaseAdmin.auth.admin.deleteUser(
      parsedId.data,
    );

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        { status: 400 },
      );
    }

    const response =
      NextResponse.json({
        message:
          "Professional apagado com sucesso",
      });

    if (
      requesterId === parsedId.data
    ) {
      response.cookies.delete(
        "sb-access-token",
      );
      response.cookies.delete(
        "sb-refresh-token",
      );
    }

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Token invalido",
      },
      { status: 401 },
    );
  }
}
