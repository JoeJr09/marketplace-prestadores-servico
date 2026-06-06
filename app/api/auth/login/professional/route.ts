import type { NextRequest } from "next/server";

import { loginProfessional } from "@/app/api/auth/professional";

export async function POST(req: NextRequest) {
  return loginProfessional(req);
}
