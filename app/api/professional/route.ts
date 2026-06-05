import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import { createProfessionalSchema } from "@/app/types/professional";

const professionalListSelect = `
  id,
  full_name,
  email,
  avatar_url,
  created_at,
  professionals!inner (
    id,
    profile_id,
    business_name,
    bio,
    years_experience,
    city,
    country,
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

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
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

async function getProfileById(id: string) {
  const db = getDatabaseClient();
  const {
    data: profile,
    error,
  } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .single();

  if (error || !profile) {
    throw new Error(
      error?.message ||
        "Perfil autenticado nao encontrado",
    );
  }

  return profile;
}

function normalizeProfessionalProfile(
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    created_at: string;
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
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
    },
  };
}

function getCreatePermissions(args: {
  requesterRole: string;
}) {
  return {
    can_create_professional:
      args.requesterRole === "professional" ||
      args.requesterRole === "admin",
    is_owner: true,
    is_admin:
      args.requesterRole === "admin",
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);

    if (token) {
      verifyAccessToken(token);
    }

    const db = getDatabaseClient();
    const {
      data: professionals,
      error,
    } = await db
      .from("profiles")
      .select(professionalListSelect)
      .eq("role", "professional")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      professionals:
        professionals?.map(
          normalizeProfessionalProfile,
        ) ?? [],
    });
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

export async function POST(req: NextRequest) {
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
      await getProfileById(requesterId);

    const permissions =
      getCreatePermissions({
        requesterRole: requester.role,
      });

    if (
      !permissions.can_create_professional
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permissao para criar professional",
        },
        { status: 403 },
      );
    }

    const parsedBody =
      createProfessionalSchema.safeParse(
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

    const {
      profile_id,
      full_name,
      email,
      password,
      phone,
      avatar_url,
      ...professionalFields
    } = parsedBody.data;

    const targetProfileId =
      requester.role === "admin" &&
      profile_id
        ? profile_id
        : requesterId;

    const targetProfile =
      targetProfileId === requesterId
        ? requester
        : await getProfileById(
            targetProfileId,
          );

    if (
      targetProfile.role !==
      "professional"
    ) {
      return NextResponse.json(
        {
          error:
            "O perfil informado nao pertence a um usuario professional",
        },
        { status: 400 },
      );
    }

    const db = getDatabaseClient();
    const {
      data: existingProfessional,
      error: existingProfessionalError,
    } = await db
      .from("professionals")
      .select("id, profile_id")
      .eq("profile_id", targetProfileId)
      .maybeSingle();

    if (existingProfessionalError) {
      return NextResponse.json(
        {
          error:
            existingProfessionalError.message,
        },
        { status: 400 },
      );
    }

    if (existingProfessional) {
      return NextResponse.json(
        {
          error:
            "Ja existe um professional para este perfil",
        },
        { status: 409 },
      );
    }

    const profileUpdates: Record<
      string,
      string | null
    > = {};

    if (full_name !== undefined) {
      profileUpdates.full_name = full_name;
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
          targetProfileId,
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

    if (
      Object.keys(profileUpdates).length > 0
    ) {
      const {
        error: profileError,
      } = await db
        .from("profiles")
        .update(profileUpdates)
        .eq("id", targetProfileId)
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

    const {
      error: professionalError,
    } = await db
      .from("professionals")
      .insert({
        profile_id: targetProfileId,
        ...professionalFields,
      });

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
      data: createdProfessional,
      error: createdProfessionalError,
    } = await db
      .from("profiles")
      .select(professionalListSelect)
      .eq("id", targetProfileId)
      .eq("role", "professional")
      .single();

    if (
      createdProfessionalError ||
      !createdProfessional
    ) {
      return NextResponse.json(
        {
          error:
            createdProfessionalError?.message ||
            "Professional criado, mas nao foi possivel carregar o registro",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Professional criado com sucesso",
        professional:
          normalizeProfessionalProfile(
            createdProfessional,
          ),
        permissions,
      },
      { status: 201 },
    );
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
