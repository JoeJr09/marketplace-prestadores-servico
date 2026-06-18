import { supabase, supabaseAdmin } from "@/app/lib/supabase";
import type {
  ServiceCard,
  ServiceCategoryOption,
} from "@/components/professionals/service-management.types";

type CategoryRecord = {
  id: string;
  name: string;
  icon_url: string | null;
};

type ServiceRecord = {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  base_price: number | string | null;
  image_url: string | null;
  is_active: boolean | null;
  categories:
    | {
        id: string;
        name: string;
        icon_url: string | null;
      }
    | {
        id: string;
        name: string;
        icon_url: string | null;
      }[];
};

const categorySelect = "id, name, icon_url";
const professionalServiceSelect = `
  id,
  professional_id,
  title,
  description,
  base_price,
  image_url,
  is_active,
  categories!inner (
    id,
    name,
    icon_url
  )
`;

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

function mapServiceCategory(
  value:
    | {
        id: string;
        name: string;
        icon_url: string | null;
      }
    | {
        id: string;
        name: string;
        icon_url: string | null;
      }[],
) {
  return Array.isArray(value) ? value[0] : value;
}

function mapProfessionalService(service: ServiceRecord): ServiceCard {
  const category = mapServiceCategory(service.categories);

  return {
    id: service.id,
    professional_id: service.professional_id,
    title: service.title,
    description: service.description,
    base_price: normalizeBasePrice(service.base_price),
    image_url: service.image_url,
    is_active: Boolean(service.is_active),
    category: {
      id: category.id,
      name: category.name,
      icon_url: category.icon_url,
    },
  };
}

export async function getServiceCategories() {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("categories")
    .select(categorySelect)
    .order("name", {
      ascending: true,
    });

  if (error || !data) {
    return [];
  }

  return data as ServiceCategoryOption[];
}

export async function getProfessionalServices(
  professionalId: string,
  options?: {
    activeOnly?: boolean;
  },
) {
  const db = getDatabaseClient();
  let query = db
    .from("services")
    .select(professionalServiceSelect)
    .eq("professional_id", professionalId)
    .order("created_at", {
      ascending: false,
    });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as ServiceRecord[]).map(mapProfessionalService);
}

export async function getProfessionalServicesByIds(
  professionalIds: string[],
  options?: {
    activeOnly?: boolean;
  },
) {
  if (professionalIds.length === 0) {
    return new Map<string, ServiceCard[]>();
  }

  const db = getDatabaseClient();
  let query = db
    .from("services")
    .select(professionalServiceSelect)
    .in("professional_id", professionalIds)
    .order("created_at", {
      ascending: false,
    });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return new Map<string, ServiceCard[]>();
  }

  const servicesByProfessional = new Map<string, ServiceCard[]>();

  (data as ServiceRecord[]).forEach((service) => {
    const mappedService = mapProfessionalService(service);
    const currentServices =
      servicesByProfessional.get(mappedService.professional_id) ?? [];

    servicesByProfessional.set(mappedService.professional_id, [
      ...currentServices,
      mappedService,
    ]);
  });

  return servicesByProfessional;
}

export async function getServiceById(serviceId: string) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("services")
    .select(professionalServiceSelect)
    .eq("id", serviceId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProfessionalService(data as ServiceRecord);
}
