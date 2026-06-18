import { NextResponse, type NextRequest } from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

type ProfessionalProfileRecord = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  professionals:
    | {
        id: string;
        profile_id: string;
        business_name: string | null;
        bio: string | null;
        years_experience: number | null;
        city: string | null;
        country: string | null;
        is_verified: boolean;
        is_insured: boolean;
      }
    | {
        id: string;
        profile_id: string;
        business_name: string | null;
        bio: string | null;
        years_experience: number | null;
        city: string | null;
        country: string | null;
        is_verified: boolean;
        is_insured: boolean;
      }[];
};

type ServiceRecord = {
  id: string;
  professional_id: string;
  category_id: string;
  title: string;
  description: string | null;
  base_price: number | string | null;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string;
};

type CategoryRecord = {
  id: string;
  name: string;
};

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

function roundCurrencyValue(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeBasePrice(value: number | string | null) {
  if (typeof value === "number") {
    return roundCurrencyValue(value);
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? roundCurrencyValue(parsed) : null;
  }

  return null;
}

function getTokenFromRequest(req: NextRequest) {
  return req.cookies.get("sb-access-token")?.value;
}

async function getAuthenticatedAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const db = getDatabaseClient();
    const { data, error } = await db
      .from("profiles")
      .select("id, role, full_name, email")
      .eq("id", payload.id)
      .single();

    if (error || !data || data.role !== "admin") {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function normalizeProfessional(profile: ProfessionalProfileRecord) {
  const professional = Array.isArray(profile.professionals)
    ? profile.professionals[0]
    : profile.professionals;

  return {
    profile_id: profile.id,
    professional_id: professional.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    business_name: professional.business_name,
    bio: professional.bio,
    years_experience: professional.years_experience,
    city: professional.city,
    country: professional.country,
    is_verified: professional.is_verified,
    is_insured: professional.is_insured,
  };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(req);

    if (!admin) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const db = getDatabaseClient();
    const [clientsResult, professionalsResult, servicesResult, categoriesResult] =
      await Promise.all([
        db
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url, created_at")
          .eq("role", "client")
          .order("created_at", { ascending: false }),
        db
          .from("profiles")
          .select(
            `
            id,
            full_name,
            email,
            phone,
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
              is_insured
            )
          `,
          )
          .eq("role", "professional")
          .order("created_at", { ascending: false }),
        db
          .from("services")
          .select(
            "id, professional_id, category_id, title, description, base_price, image_url, is_active, created_at",
          )
          .order("created_at", { ascending: false }),
        db.from("categories").select("id, name").order("name", { ascending: true }),
      ]);

    if (clientsResult.error) {
      return NextResponse.json({ error: clientsResult.error.message }, { status: 400 });
    }

    if (professionalsResult.error) {
      return NextResponse.json(
        { error: professionalsResult.error.message },
        { status: 400 },
      );
    }

    if (servicesResult.error) {
      return NextResponse.json({ error: servicesResult.error.message }, { status: 400 });
    }

    if (categoriesResult.error) {
      return NextResponse.json(
        { error: categoriesResult.error.message },
        { status: 400 },
      );
    }

    const professionals = (professionalsResult.data ?? []).map((profile) =>
      normalizeProfessional(profile as ProfessionalProfileRecord),
    );
    const categories = (categoriesResult.data ?? []) as CategoryRecord[];
    const professionalsById = new Map(
      professionals.map((professional) => [professional.professional_id, professional]),
    );
    const categoriesById = new Map(categories.map((category) => [category.id, category]));

    const services = ((servicesResult.data ?? []) as ServiceRecord[]).map((service) => {
      const professional = professionalsById.get(service.professional_id);
      const category = categoriesById.get(service.category_id);

      return {
        id: service.id,
        professional_id: service.professional_id,
        professional_profile_id: professional?.profile_id ?? null,
        professional_business_name: professional?.business_name ?? "Prestador",
        category_id: service.category_id,
        category_name: category?.name ?? "Sem categoria",
        title: service.title,
        description: service.description,
        base_price: normalizeBasePrice(service.base_price),
        image_url: service.image_url,
        is_active: Boolean(service.is_active),
        created_at: service.created_at,
      };
    });

    return NextResponse.json({
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
      },
      clients: clientsResult.data ?? [],
      professionals,
      services,
      categories,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar o painel admin",
      },
      { status: 500 },
    );
  }
}
