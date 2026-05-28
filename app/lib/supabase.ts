import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(
  key:
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
) {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${key}`
    );
  }

  return value;
}

const supabaseUrl = getRequiredEnv(
  "NEXT_PUBLIC_SUPABASE_URL"
);

const supabaseAnonKey = getRequiredEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  serviceRoleKey
    ? createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;
