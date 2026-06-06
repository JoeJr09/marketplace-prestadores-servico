import { cookies } from "next/headers";
import {
  notFound,
  redirect,
} from "next/navigation";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import { ServiceManagementWorkspace } from "@/components/professionals/ServiceManagementWorkspace";
import type {
  ServiceRequestCard,
  ServiceRequestStatus,
} from "@/components/professionals/service-management.types";

type ProfessionalRecord = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  professionals:
    | {
        id: string;
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
  date_service: string;
  status: string;
};

const professionalSelect = `
  id,
  full_name,
  email,
  avatar_url,
  role,
  professionals!inner (
    id,
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

async function getServiceRequests(
  professionalId: string,
) {
  const db = getDatabaseClient();
  const {
    data: requests,
    error,
  } = await db
    .from("calendar")
    .select(
      "id, created_at, id_cliente, date_service, status",
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

  return (
    requests as CalendarRequestRecord[]
  ).map((request) => {
    const client =
      clientsById.get(
        request.id_cliente,
      );

    return {
      id: request.id,
      client_id: request.id_cliente,
      client_name:
        client?.full_name ??
        "Cliente sem nome",
      client_email:
        client?.email ?? "",
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

function normalizeProfessional(
  professional: ProfessionalRecord,
) {
  const detail = Array.isArray(
    professional.professionals,
  )
    ? professional.professionals[0]
    : professional.professionals;

  return {
    professional_id:
      detail?.id ?? "",
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

function getActiveTab(
  tabValue:
    | string
    | string[]
    | undefined,
) {
  return tabValue === "requests"
    ? "requests"
    : "services";
}

export default async function ProfessionalServiceManagementPage(
  props: {
    params: Promise<{
      id: string;
    }>;
    searchParams: Promise<{
      tab?:
        | string
        | string[]
        | undefined;
    }>;
  },
) {
  const { id } = await props.params;
  const searchParams =
    await props.searchParams;
  const authenticatedUser =
    await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/login/professional");
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

  const normalizedProfessional =
    normalizeProfessional(
      professional,
    );
  const serviceRequests =
    await getServiceRequests(
      normalizedProfessional.professional_id,
    );

  return (
    <ServiceManagementWorkspace
      professional={
        normalizedProfessional
      }
      serviceRequests={
        serviceRequests
      }
      activeTab={getActiveTab(
        searchParams.tab,
      )}
    />
  );
}
