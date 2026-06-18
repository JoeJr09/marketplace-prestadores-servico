export type ProfessionalDashboardProfile = {
  professional_id: string;
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    phone?: string | null;
    avatar_url: string | null;
  };
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
};

export type ServiceCategoryOption = {
  id: string;
  name: string;
  icon_url: string | null;
};

export type ServiceStatus = "Active" | "Draft";

export type ServiceRequestStatus =
  | "PENDENTE"
  | "ACEITA"
  | "RECUSADA"
  | "CONCLUIDA"
  | "ABORTADA";

export type ServiceCard = {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  base_price: number | null;
  image_url: string | null;
  is_active: boolean;
  category: ServiceCategoryOption;
};

export type ServiceRequestCard = {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  service_id: string | null;
  service_title: string | null;
  service_category_name: string | null;
  created_at: string;
  date_service: string;
  status: ServiceRequestStatus;
};
