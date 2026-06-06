import type { NextRequest } from "next/server";

import { registerProfessional } from "@/app/api/auth/professional";

export async function POST(req: NextRequest) {
  return registerProfessional(req);
}
