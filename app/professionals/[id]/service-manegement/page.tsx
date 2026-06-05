import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import { ServiceManagementWorkspace } from "@/components/professionals/ServiceManagementWorkspace";

type ProfessionalRecord = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  professionals:
    | {
        business_name: string | null;
        bio: string | null;
        years_experience: number | null;
        city: string | null;
        country: string | null;
        is_verified: boolean;
        is_insured: boolean;
        tier_label: string | null;
        avg_rating: number | null;
        total_reviews: number | null;
      }
    | {
        business_name: string | null;
        bio: string | null;
        years_experience: number | null;
        city: string | null;
        country: string | null;
        is_verified: boolean;
        is_insured: boolean;
        tier_label: string | null;
        avg_rating: number | null;
        total_reviews: number | null;
      }[];
};

const professionalSelect = `
  id,
  full_name,
  email,
  avatar_url,
  role,
  professionals!inner (
    business_name,
    bio,
    years_experience,
    city,
    country,
    is_verified,
    is_insured,
    tier_label,
    avg_rating,
    total_reviews
  )
`;

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(
    "sb-access-token",
  )?.value;

  if (!token) {
    return null;
  }

  try {
    const payload =
      verifyAccessToken(token);
    const db = getDatabaseClient();
    const { data: profile, error } =
      await db
        .from("profiles")
        .select("id, role")
        .eq("id", payload.id)
        .single();

    if (error || !profile) {
      return null;
    }

    return profile;
  } catch {
    return null;
  }
}

async function getProfessional(
  id: string,
) {
  const db = getDatabaseClient();
  const {
    data: professional,
    error,
  } = await db
    .from("profiles")
    .select(professionalSelect)
    .eq("id", id)
    .eq("role", "professional")
    .single();

  if (error || !professional) {
    return null;
  }

  return professional as ProfessionalRecord;
}

function normalizeProfessional(
  professional: ProfessionalRecord,
) {
  const detail = Array.isArray(
    professional.professionals,
  )
    ? professional.professionals[0]
    : professional.professionals;

  return {
    profile: {
      id: professional.id,
      full_name: professional.full_name,
      email: professional.email,
      avatar_url: professional.avatar_url,
    },
    business_name:
      detail?.business_name ?? null,
    bio: detail?.bio ?? null,
    years_experience:
      detail?.years_experience ?? null,
    city: detail?.city ?? null,
    country: detail?.country ?? null,
    is_verified:
      detail?.is_verified ?? false,
    is_insured:
      detail?.is_insured ?? false,
    tier_label:
      detail?.tier_label ?? null,
    avg_rating:
      detail?.avg_rating ?? null,
    total_reviews:
      detail?.total_reviews ?? null,
  };
}

export default async function ProfessionalServiceManagementPage(
  props: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await props.params;
  const authenticatedUser =
    await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/login");
  }

  const canManage =
    authenticatedUser.id === id ||
    authenticatedUser.role === "admin";

  if (!canManage) {
    notFound();
  }

  const professional =
    await getProfessional(id);

  if (!professional) {
    notFound();
  }

  return (
    <ServiceManagementWorkspace
      professional={normalizeProfessional(
        professional,
      )}
    />
  );
}
