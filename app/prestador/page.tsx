import Footer from "@/components/e/Footer";
import Header from "@/components/e/Header";
import { ProfessionalsDirectory } from "@/components/e/ProfessionalsDirectory";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";

type ProfessionalCard = {
  id: string;
  business_name: string | null;
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  avg_rating: number | null;
  total_reviews: number | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

const professionalSelect = `
  id,
  business_name,
  bio,
  years_experience,
  city,
  country,
  is_verified,
  avg_rating,
  total_reviews,
  profiles!inner (
    full_name,
    avatar_url,
    role
  )
`;

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getProfessionals() {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("professionals")
    .select(professionalSelect)
    .eq("profiles.role", "professional")
    .order("created_at", {
      ascending: false,
    });

  if (error || !data) {
    return [];
  }

  return data.map((professional) => {
    const profile = Array.isArray(
      professional.profiles,
    )
      ? professional.profiles[0]
      : professional.profiles;

    return {
      id: professional.id,
      business_name:
        professional.business_name,
      bio: professional.bio,
      years_experience:
        professional.years_experience,
      city: professional.city,
      country: professional.country,
      is_verified:
        professional.is_verified,
      avg_rating:
        professional.avg_rating,
      total_reviews:
        professional.total_reviews,
      profile: {
        full_name:
          profile?.full_name ?? null,
        avatar_url:
          profile?.avatar_url ?? null,
      },
    } satisfies ProfessionalCard;
  });
}

export default async function PrestadorPage() {
  const professionals =
    await getProfessionals();

  return (
    <div className="min-h-screen bg-acode-mist text-brand-navy">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
            Encontre um prestador de servicos
          </h1>
          <p className="mt-3 max-w-2xl text-base text-text-muted">
            Prestadores reais cadastrados no Supabase. Para abrir detalhes de um
            profissional especifico, entre com sua conta de cliente.
          </p>
        </div>

        <ProfessionalsDirectory
          professionals={professionals}
        />
      </main>

      <Footer />
    </div>
  );
}
