import { supabase } from "@/lib/supabase";

export async function createProfile(
  userId: string,
  fullName: string,
  email: string,
  role: string
) {
  return await supabase
    .from("profiles")
    .insert({
      id: userId,
      full_name: fullName,
      email,
      role,
    });
}

export async function getProfile(
  userId: string
) {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}