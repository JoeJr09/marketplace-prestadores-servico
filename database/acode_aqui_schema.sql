CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  icon_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text,
  type text NOT NULL DEFAULT 'text'::text CHECK (type = ANY (ARRAY['text'::text, 'image'::text, 'status_update'::text, 'file'::text])),
  file_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL,
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  amount numeric NOT NULL,
  platform_fee numeric DEFAULT 0,
  professional_net numeric,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
  payment_method text,
  external_payment_id text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id),
  CONSTRAINT payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT payments_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  tier text NOT NULL,
  price_monthly numeric NOT NULL,
  price_yearly numeric,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_highlighted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.professional_categories (
  professional_id uuid NOT NULL,
  category_id uuid NOT NULL,
  CONSTRAINT professional_categories_pkey PRIMARY KEY (professional_id, category_id),
  CONSTRAINT professional_categories_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT professional_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.professionals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL UNIQUE,
  business_name text,
  bio text,
  years_experience integer,
  city text,
  country text,
  location USER-DEFINED,
  is_verified boolean NOT NULL DEFAULT false,
  is_insured boolean NOT NULL DEFAULT false,
  tier_label text,
  profile_strength integer DEFAULT 0 CHECK (profile_strength >= 0 AND profile_strength <= 100),
  avg_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  avg_response_hours integer,
  plan_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT professionals_pkey PRIMARY KEY (id),
  CONSTRAINT professionals_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT professionals_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  avatar_url text,
  role text NOT NULL CHECK (role = ANY (ARRAY['client'::text, 'professional'::text, 'admin'::text])),
  plan_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.request_timeline (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL,
  step_title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text])),
  step_order integer NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT request_timeline_pkey PRIMARY KEY (id),
  CONSTRAINT request_timeline_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL UNIQUE,
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id),
  CONSTRAINT reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.service_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  service_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::request_status,
  title text NOT NULL,
  description text,
  location text,
  scheduled_date timestamp with time zone,
  agreed_price numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_requests_pkey PRIMARY KEY (id),
  CONSTRAINT service_requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT service_requests_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT service_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  professional_id uuid NOT NULL,
  category_id uuid,
  title text NOT NULL,
  description text,
  base_price numeric NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  icon_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text,
  type text NOT NULL DEFAULT 'text'::text CHECK (type = ANY (ARRAY['text'::text, 'image'::text, 'status_update'::text, 'file'::text])),
  file_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL,
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  amount numeric NOT NULL,
  platform_fee numeric DEFAULT 0,
  professional_net numeric,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
  payment_method text,
  external_payment_id text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id),
  CONSTRAINT payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT payments_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  tier text NOT NULL,
  price_monthly numeric NOT NULL,
  price_yearly numeric,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_highlighted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.professional_categories (
  professional_id uuid NOT NULL,
  category_id uuid NOT NULL,
  CONSTRAINT professional_categories_pkey PRIMARY KEY (professional_id, category_id),
  CONSTRAINT professional_categories_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT professional_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.professionals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL UNIQUE,
  business_name text,
  bio text,
  years_experience integer,
  city text,
  country text,
  location USER-DEFINED,
  is_verified boolean NOT NULL DEFAULT false,
  is_insured boolean NOT NULL DEFAULT false,
  tier_label text,
  profile_strength integer DEFAULT 0 CHECK (profile_strength >= 0 AND profile_strength <= 100),
  avg_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  avg_response_hours integer,
  plan_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT professionals_pkey PRIMARY KEY (id),
  CONSTRAINT professionals_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT professionals_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  avatar_url text,
  role text NOT NULL CHECK (role = ANY (ARRAY['client'::text, 'professional'::text, 'admin'::text])),
  plan_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.request_timeline (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL,
  step_title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text])),
  step_order integer NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT request_timeline_pkey PRIMARY KEY (id),
  CONSTRAINT request_timeline_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL UNIQUE,
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id),
  CONSTRAINT reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.service_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  service_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::request_status,
  title text NOT NULL,
  description text,
  location text,
  scheduled_date timestamp with time zone,
  agreed_price numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_requests_pkey PRIMARY KEY (id),
  CONSTRAINT service_requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT service_requests_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT service_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  professional_id uuid NOT NULL,
  category_id uuid,
  title text NOT NULL,
  description text,
  base_price numeric NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);