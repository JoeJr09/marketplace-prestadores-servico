import { logoutProfessional } from "@/app/api/auth/professional";

export async function POST() {
  return logoutProfessional();
}
