import { NextResponse, type NextRequest } from "next/server";

import {
  generateAccessToken,
  generateRefreshToken,
} from "@/app/lib/jwt";
import { verifyAccessToken } from "@/app/lib/jwt";
import { normalizeBusinessName } from "@/app/lib/professional-slug";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import {
  loginAuthSchema,
  registerAuthSchema,
} from "@/app/types/auth";
import { updateProfessionalSchema } from "@/app/types/professional";

const professionalSelect = `
  id,
  full_name,
  email,
  phone,
  avatar_url,
  bio,
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

const profileSelect =
  "id, full_name, email, phone, avatar_url, bio, role, created_at, updated_at";

const professionalFields = [
  "business_name",
  "bio",
  "years_experience",
  "city",
  "country",
  "is_insured",
] as const;

const profileFields = [
  "full_name",
  "email",
  "phone",
  "avatar_url",
] as const;

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

function normalizeProfessionalProfile(profile: {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  professionals:
    | Record<string, unknown>
    | Record<string, unknown>[];
}) {
  const professional = Array.isArray(profile.professionals)
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
      bio: profile.bio,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    },
  };
}

function getTokenFromRequest(req: NextRequest) {
  return req.cookies.get("sb-access-token")?.value;
}

function getAuthenticatedUserId(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return verifyAccessToken(token).id;
}

async function getProfessionalByProfileId(profileId: string) {
  const db = getDatabaseClient();
  const { data: profile, error } = await db
    .from("profiles")
    .select(professionalSelect)
    .eq("id", profileId)
    .eq("role", "professional")
    .single();

  if (error || !profile) {
    throw new Error(error?.message || "Prestador nao encontrado");
  }

  return normalizeProfessionalProfile(profile);
}

function setAuthCookies(
  response: NextResponse,
  payload: {
    id: string;
    email: string;
    role: "professional";
  },
) {
  response.cookies.set("sb-access-token", generateAccessToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  response.cookies.set("sb-refresh-token", generateRefreshToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
}

function isDuplicateConstraintError(message: string) {
  return (
    message.includes("duplicate key value") ||
    message.includes("profiles_pkey") ||
    message.includes("profiles_email_key") ||
    message.includes("professionals_profile_id_key")
  );
}

export async function loginProfessional(req: NextRequest) {
  try {
    const parsedBody = loginAuthSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, password } = parsedBody.data;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          error: "Email ou senha inválidos",
        },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } =
      await (supabaseAdmin ?? supabase)
        .from("profiles")
        .select(profileSelect)
        .eq("id", data.user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "Perfil não encontrado",
        },
        { status: 404 },
      );
    }

    if (profile.role !== "professional") {
      return NextResponse.json(
        {
          error: "Esta conta não é de prestador.",
        },
        { status: 403 },
      );
    }

    const professional = await getProfessionalByProfileId(profile.id);
    const response = NextResponse.json({
      message: "Login de prestador realizado",
      user: profile,
      professional,
    });

    setAuthCookies(response, {
      id: profile.id,
      email: profile.email,
      role: "professional",
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro interno",
      },
      { status: 500 },
    );
  }
}

export async function logoutProfessional() {
  const response = NextResponse.json({
    message: "Logout de prestador feito",
  });

  clearAuthCookies(response);

  return response;
}

export async function getProfessionalMe(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 },
      );
    }

    const professional = await getProfessionalByProfileId(userId);

    return NextResponse.json({
      user: professional.profile,
      professional,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Token inválido",
      },
      { status: 401 },
    );
  }
}

export async function updateProfessionalMe(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 },
      );
    }

    const parsedBody = updateProfessionalSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const blockedFields = adminOnlyFields.filter(
      (field) => parsedBody.data[field] !== undefined,
    );

    if (blockedFields.length > 0) {
      return NextResponse.json(
        {
          error: "Sem permissão para alterar campos administrativos.",
          fields: blockedFields,
        },
        { status: 403 },
      );
    }

    if ((parsedBody.data.email || parsedBody.data.password) && !supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Para alterar email ou senha, configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 503 },
      );
    }

    if (supabaseAdmin && (parsedBody.data.email || parsedBody.data.password)) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: parsedBody.data.email,
        password: parsedBody.data.password,
        user_metadata:
          parsedBody.data.full_name !== undefined
            ? { full_name: parsedBody.data.full_name }
            : undefined,
      });

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 },
        );
      }
    }

    const db = getDatabaseClient();
    const profileUpdates: Record<string, string | null> = {};
    const professionalUpdates: Record<string, string | number | boolean | null> =
      {};

    for (const field of profileFields) {
      if (parsedBody.data[field] !== undefined) {
        profileUpdates[field] = parsedBody.data[field] ?? null;
      }
    }

    for (const field of professionalFields) {
      if (parsedBody.data[field] !== undefined) {
        professionalUpdates[field] = parsedBody.data[field] ?? null;
      }
    }

    if (typeof parsedBody.data.business_name === "string") {
      const businessName = normalizeBusinessName(parsedBody.data.business_name);

      if (!businessName) {
        return NextResponse.json(
          {
            error: "Nome da empresa inválido.",
          },
          { status: 400 },
        );
      }

      if (await businessNameExists(businessName, userId)) {
        return NextResponse.json(
          {
            error: "Já existe um prestador com este nome de empresa.",
          },
          { status: 409 },
        );
      }

      professionalUpdates.business_name = businessName;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await db
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId)
        .eq("role", "professional");

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 },
        );
      }
    }

    if (Object.keys(professionalUpdates).length > 0) {
      const { error } = await db
        .from("professionals")
        .update(professionalUpdates)
        .eq("profile_id", userId);

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 },
        );
      }
    }

    const professional = await getProfessionalByProfileId(userId);

    return NextResponse.json({
      message: "Prestador atualizado com sucesso",
      user: professional.profile,
      professional,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Token inválido",
      },
      { status: 401 },
    );
  }
}

export async function deleteProfessionalMe(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Para apagar o prestador autenticado, configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 503 },
      );
    }

    const { error: professionalError } = await supabaseAdmin
      .from("professionals")
      .delete()
      .eq("profile_id", userId);

    if (professionalError) {
      return NextResponse.json(
        {
          error: professionalError.message,
        },
        { status: 400 },
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId)
      .eq("role", "professional");

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 400 },
      );
    }

    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      message: "Prestador apagado com sucesso",
    });

    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Token inválido",
      },
      { status: 401 },
    );
  }
}

export async function registerProfessional(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedBody = registerAuthSchema.safeParse({
      ...body,
      role: "PRESTADOR",
    });

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Configure SUPABASE_SERVICE_ROLE_KEY para cadastrar prestadores via backend.",
        },
        { status: 503 },
      );
    }

    const {
      email,
      password,
      full_name,
      phone,
    } = parsedBody.data;

    const { data: existingProfileByEmail, error: existingProfileByEmailError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, phone, role")
        .eq("email", email)
        .maybeSingle();

    if (existingProfileByEmailError) {
      return NextResponse.json(
        {
          error: existingProfileByEmailError.message,
        },
        { status: 400 },
      );
    }

    if (existingProfileByEmail) {
      return NextResponse.json(
        {
          error: "Já existe um perfil cadastrado com este email.",
          conflict: {
            source: "profiles.email",
            profileId: existingProfileByEmail.id,
          },
        },
        { status: 409 },
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        role: "professional",
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          error: error?.message || "Erro ao criar usuário",
        },
        { status: 400 },
      );
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        full_name,
        phone,
        role: "professional",
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);

      const duplicateConflict = isDuplicateConstraintError(
        profileError.message,
      );

      return NextResponse.json(
        {
          error: duplicateConflict
            ? "O perfil deste usuário já existe no banco."
            : profileError.message,
          conflict: duplicateConflict
            ? {
                source: "profiles.id",
                profileId: data.user.id,
              }
            : undefined,
        },
        { status: duplicateConflict ? 409 : 400 },
      );
    }

    const businessName =
      typeof body.business_name === "string"
        ? normalizeBusinessName(body.business_name)
        : "";

    if (!businessName) {
      await supabaseAdmin.from("profiles").delete().eq("id", data.user.id);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);

      return NextResponse.json(
        {
          error: "Informe um nome de empresa válido para o prestador.",
        },
        { status: 400 },
      );
    }

    if (await businessNameExists(businessName)) {
      await supabaseAdmin.from("profiles").delete().eq("id", data.user.id);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);

      return NextResponse.json(
        {
          error: "Já existe um prestador com este nome de empresa.",
        },
        { status: 409 },
      );
    }

    const professionalPayload = {
      profile_id: data.user.id,
      business_name: businessName,
      bio:
        typeof body.bio === "string" && body.bio.trim()
          ? body.bio.trim()
          : null,
      city:
        typeof body.city === "string" && body.city.trim()
          ? body.city.trim()
          : null,
      country:
        typeof body.country === "string" && body.country.trim()
          ? body.country.trim()
          : null,
    };

    const { error: professionalError } = await supabaseAdmin
      .from("professionals")
      .insert(professionalPayload);

    if (professionalError) {
      await supabaseAdmin.from("profiles").delete().eq("id", data.user.id);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);

      const duplicateConflict = isDuplicateConstraintError(
        professionalError.message,
      );

      return NextResponse.json(
        {
          error: duplicateConflict
            ? "O prestador deste usuário já existe no banco."
            : professionalError.message,
          conflict: duplicateConflict
            ? {
                source: "professionals.profile_id",
                profileId: data.user.id,
              }
            : undefined,
        },
        { status: duplicateConflict ? 409 : 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Prestador criado com sucesso",
        user: {
          id: data.user.id,
          email,
          full_name,
          phone,
          role: "professional",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro interno",
      },
      { status: 500 },
    );
  }
}
