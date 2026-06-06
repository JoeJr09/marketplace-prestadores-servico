import { cookies } from "next/headers";
import {
  notFound,
  redirect,
} from "next/navigation";

import Header from "@/components/e/Header";
import { ProfessionalProfileSettingsPanel } from "@/components/e/ProfessionalProfileSettingsPanel";
import { verifyAccessToken } from "@/app/lib/jwt";
import { normalizeBusinessName } from "@/app/lib/professional-slug";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";

type ProfessionalForEdit = {
  profile_id: string;
  business_name: string;
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
  is_insured: boolean;
  profile: {
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
};

const editSelect = `
  profile_id,
  business_name,
  bio,
  years_experience,
  city,
  country,
  is_insured,
  profiles!inner (
    full_name,
    email,
    phone,
    avatar_url,
    role
  )
`;

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyAccessToken(token).id;
  } catch {
    return null;
  }
}

async function getProfessionalByBusinessName(businessName: string) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("professionals")
    .select(editSelect)
    .eq("profiles.role", "professional");

  if (error || !data) {
    return null;
  }

  const professional = data.find(
    (item) => normalizeBusinessName(item.business_name ?? "") === businessName,
  );

  if (!professional || !professional.business_name) {
    return null;
  }

  const profile = Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles;

  return {
    profile_id: professional.profile_id,
    business_name: professional.business_name,
    bio: professional.bio,
    years_experience: professional.years_experience,
    city: professional.city,
    country: professional.country,
    is_insured: professional.is_insured,
    profile: {
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? "",
      phone: profile?.phone ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
  } satisfies ProfessionalForEdit;
}

export default async function PrestadorEditPage({
  params,
}: {
  params: Promise<{ businessName: string }>;
}) {
  const authenticatedUserId = await getAuthenticatedUserId();

  if (!authenticatedUserId) {
    redirect("/login/professional");
  }

  const { businessName } = await params;
  const professional = await getProfessionalByBusinessName(
    normalizeBusinessName(decodeURIComponent(businessName)),
  );

  if (!professional) {
    notFound();
  }

  if (professional.profile_id !== authenticatedUserId) {
    redirect(`/prestador/${professional.business_name}`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#eff5f4_42%,_#dee4e3_100%)] text-text-main">
      <Header />

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <ProfessionalProfileSettingsPanel professional={professional} />
      </section>
    </main>
  );
}
