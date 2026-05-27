import { supabase } from "@/lib/supabase";

/**
 * =========================
 * TYPES
 * =========================
 */

export type UserRole =
  | "CLIENTE"
  | "PRESTADOR"
  | "ADMIN";

export interface CreateProfileDTO {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface UpdateProfileDTO {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  city?: string;
  state?: string;
}

/**
 * =========================
 * CREATE PROFILE
 * =========================
 */

export async function createProfile({
  userId,
  fullName,
  email,
  role,
  avatarUrl,
}: CreateProfileDTO) {
  try {
    /**
     * segurança
     */
    const allowedRoles: UserRole[] = [
      "CLIENTE",
      "PRESTADOR",
      "ADMIN",
    ];

    if (!allowedRoles.includes(role)) {
      throw new Error("Role inválida");
    }

    /**
     * cria profile
     */
    const { data, error } =
      await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: fullName,
          email,
          role,
          avatar_url: avatarUrl || null,
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    /**
     * se for prestador
     * cria tabela professional
     */
    if (role === "PRESTADOR") {
      const {
        error: professionalError,
      } = await supabase
        .from("professionals")
        .insert({
          profile_id: userId,
        });

      if (professionalError) {
        throw professionalError;
      }
    }

    return {
      success: true,
      data,
    };

  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Erro ao criar profile",
    };
  }
}

/**
 * =========================
 * GET PROFILE
 * =========================
 */

export async function getProfile(
  userId: string
) {
  try {
    const { data, error } =
      await supabase
        .from("profiles")
        .select(`
          *,
          professionals (*)
        `)
        .eq("id", userId)
        .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };

  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Erro ao buscar profile",
    };
  }
}

/**
 * =========================
 * UPDATE PROFILE
 * =========================
 */

export async function updateProfile(
  userId: string,
  payload: UpdateProfileDTO
) {
  try {
    const { data, error } =
      await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };

  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Erro ao atualizar profile",
    };
  }
}

/**
 * =========================
 * DELETE PROFILE
 * =========================
 */

export async function deleteProfile(
  userId: string
) {
  try {
    /**
     * remove professional
     */
    await supabase
      .from("professionals")
      .delete()
      .eq("profile_id", userId);

    /**
     * remove profile
     */
    const { error } =
      await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };

  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Erro ao deletar profile",
    };
  }
}

/**
 * =========================
 * GET ALL PROFESSIONALS
 * =========================
 */

export async function getProfessionals() {
  try {
    const { data, error } =
      await supabase
        .from("profiles")
        .select(`
          *,
          professionals (*)
        `)
        .eq("role", "PRESTADOR");

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };

  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Erro ao buscar prestadores",
    };
  }
}

/**
 * =========================
 * GET PROFILE BY EMAIL
 * =========================
 */

export async function getProfileByEmail(
  email: string
) {
  try {
    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };

  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Erro ao buscar profile",
    };
  }
}

/**
 * =========================
 * CHECK ADMIN
 * =========================
 */

export async function isAdmin(
  userId: string
) {
  try {
    const { data, error } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    if (error) {
      throw error;
    }

    return data.role === "ADMIN";

  } catch {
    return false;
  }
}