import { cookies } from "next/headers";

import { verifyAccessToken } from "@/app/lib/jwt";
import { normalizeBusinessName } from "@/app/lib/professional-slug";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import type {
  ProfessionalDashboardProfile,
  ServiceRequestCard,
  ServiceRequestStatus,
} from "@/components/professionals/service-management.types";

type AuthenticatedProfessionalUser = {
  id: string;
  role: "client" | "professional" | "admin";
};

type ProfessionalPortalRecord = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
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
        tier_label: string | null;
        avg_rating: number | null;
        total_reviews: number | null;
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
        tier_label: string | null;
        avg_rating: number | null;
        total_reviews: number | null;
      }[];
};

type CalendarRequestRecord = {
  id: string;
  created_at: string;
  id_cliente: string;
  id_service: string | null;
  date_service: string;
  status: string;
};

export type ProfessionalPortalProfileForEdit = {
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

const professionalPortalSelect = `
  id,
  full_name,
  email,
  phone,
  avatar_url,
  role,
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
    avg_rating,
    total_reviews
  )
`;

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

export async function getAuthenticatedPortalUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(
    "sb-access-token",
  )?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyAccessToken(
      token,
    ) as AuthenticatedProfessionalUser;
  } catch {
    return null;
  }
}

export async function getProfessionalPortalProfileByBusinessName(
  businessName: string,
) {
  const db = getDatabaseClient();
  const {
    data: professional,
    error,
  } = await db
    .from("profiles")
    .select(professionalPortalSelect)
    .eq("role", "professional");

  if (error || !professional) {
    return null;
  }

  const profile = (
    professional as ProfessionalPortalRecord[]
  ).find((item) => {
    const detail = Array.isArray(
      item.professionals,
    )
      ? item.professionals[0]
      : item.professionals;

    return (
      normalizeBusinessName(
        detail?.business_name ?? "",
      ) === businessName
    );
  });

  if (!profile) {
    return null;
  }

  const detail = Array.isArray(
    profile.professionals,
  )
    ? profile.professionals[0]
    : profile.professionals;

  if (!detail?.business_name) {
    return null;
  }

  return {
    professional_id: detail.id,
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
    },
    business_name:
      detail.business_name,
    bio: detail.bio,
    years_experience:
      detail.years_experience,
    city: detail.city,
    country: detail.country,
    is_verified:
      detail.is_verified,
    is_insured:
      detail.is_insured,
    tier_label:
      detail.tier_label,
    avg_rating:
      detail.avg_rating,
    total_reviews:
      detail.total_reviews,
  } satisfies ProfessionalDashboardProfile;
}

export async function getProfessionalPortalProfileByProfileId(
  profileId: string,
) {
  const db = getDatabaseClient();
  const {
    data: professional,
    error,
  } = await db
    .from("profiles")
    .select(professionalPortalSelect)
    .eq("id", profileId)
    .eq("role", "professional")
    .single();

  if (error || !professional) {
    return null;
  }

  const profile =
    professional as ProfessionalPortalRecord;
  const detail = Array.isArray(
    profile.professionals,
  )
    ? profile.professionals[0]
    : profile.professionals;

  if (!detail?.business_name) {
    return null;
  }

  return {
    professional_id: detail.id,
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
    },
    business_name:
      detail.business_name,
    bio: detail.bio,
    years_experience:
      detail.years_experience,
    city: detail.city,
    country: detail.country,
    is_verified:
      detail.is_verified,
    is_insured:
      detail.is_insured,
    tier_label:
      detail.tier_label,
    avg_rating:
      detail.avg_rating,
    total_reviews:
      detail.total_reviews,
  } satisfies ProfessionalDashboardProfile;
}

export function mapPortalProfileToEdit(
  professional: ProfessionalDashboardProfile,
) {
  return {
    profile_id: professional.profile.id,
    business_name:
      professional.business_name ??
      "",
    bio: professional.bio,
    years_experience:
      professional.years_experience,
    city: professional.city,
    country: professional.country,
    is_insured:
      professional.is_insured,
    profile: {
      full_name:
        professional.profile.full_name,
      email: professional.profile.email,
      phone:
        professional.profile.phone ??
        null,
      avatar_url:
        professional.profile.avatar_url,
    },
  } satisfies ProfessionalPortalProfileForEdit;
}

export async function getProfessionalServiceRequests(
  professionalId: string,
) {
  const db = getDatabaseClient();
  const {
    data: requests,
    error,
    } = await db
      .from("calendar")
      .select(
      "id, created_at, id_cliente, id_service, date_service, status",
    )
    .eq("id_professional", professionalId)
    .order("created_at", {
      ascending: false,
    });

  if (error || !requests) {
    return [];
  }

  const clientIds = Array.from(
    new Set(
      requests
        .map((request) => request.id_cliente)
        .filter(
          (
            clientId,
          ): clientId is string =>
            typeof clientId === "string",
        ),
    ),
  );

  const clientsById = new Map<
    string,
    {
      full_name: string | null;
      email: string;
    }
  >();
  const serviceIds = Array.from(
    new Set(
      requests
        .map((request) => request.id_service)
        .filter(
          (serviceId): serviceId is string =>
            typeof serviceId === "string",
        ),
    ),
  );

  if (clientIds.length > 0) {
    const {
      data: clientProfiles,
      error: clientProfilesError,
    } = await db
      .from("profiles")
      .select("id, full_name, email")
      .in("id", clientIds);

    if (
      !clientProfilesError &&
      clientProfiles
    ) {
      clientProfiles.forEach((client) => {
        clientsById.set(client.id, {
          full_name:
            client.full_name,
          email: client.email,
        });
      });
    }
  }

  const servicesById = new Map<
    string,
    {
      title: string;
      categoryName: string | null;
    }
  >();

  if (serviceIds.length > 0) {
    const {
      data: services,
      error: servicesError,
    } = await db
      .from("services")
      .select(
        "id, title, categories(name)",
      )
      .in("id", serviceIds);

    if (!servicesError && services) {
      services.forEach((service) => {
        const category = Array.isArray(service.categories)
          ? service.categories[0]
          : service.categories;

        servicesById.set(service.id, {
          title: service.title,
          categoryName: category?.name ?? null,
        });
      });
    }
  }

  return (
    requests as CalendarRequestRecord[]
  ).map((request) => {
    const client =
      clientsById.get(
        request.id_cliente,
      );
    const service =
      request.id_service
        ? servicesById.get(request.id_service)
        : null;

    return {
      id: request.id,
      client_id: request.id_cliente,
      client_name:
        client?.full_name ??
        "Cliente sem nome",
      client_email:
        client?.email ?? "",
      service_id:
        request.id_service,
      service_title:
        service?.title ?? null,
      service_category_name:
        service?.categoryName ?? null,
      created_at:
        request.created_at,
      date_service:
        request.date_service,
      status: (
        typeof request.status ===
          "string" &&
        [
          "PENDENTE",
          "ACEITA",
          "RECUSADA",
          "CONCLUIDA",
          "ABORTADA",
        ].includes(request.status)
          ? request.status
          : "PENDENTE"
      ) as ServiceRequestStatus,
    } satisfies ServiceRequestCard;
  });
}
