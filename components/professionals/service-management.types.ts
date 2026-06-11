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

export type ServiceStatus = "Active" | "Draft";

export type ServiceRequestStatus =
  | "PENDENTE"
  | "ACEITA"
  | "RECUSADA"
  | "CONCLUIDA"
  | "ABORTADA";

export type ServiceCategory =
  | "Engineering"
  | "Operations"
  | "Automation"
  | "Infrastructure";

export type ServiceCard = {
  id: string;
  title: string;
  category: ServiceCategory;
  fee: string;
  unit: string;
  description: string;
  tag: string;
  status: ServiceStatus;
};

export type ServiceRequestCard = {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  created_at: string;
  date_service: string;
  status: ServiceRequestStatus;
};
