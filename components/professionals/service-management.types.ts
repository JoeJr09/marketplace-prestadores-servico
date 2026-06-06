export type ProfessionalDashboardProfile = {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
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
