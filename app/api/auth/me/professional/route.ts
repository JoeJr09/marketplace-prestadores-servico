import type { NextRequest } from "next/server";

import {
  deleteProfessionalMe,
  getProfessionalMe,
  updateProfessionalMe,
} from "@/app/api/auth/professional";

export async function GET(req: NextRequest) {
  return getProfessionalMe(req);
}

export async function PUT(req: NextRequest) {
  return updateProfessionalMe(req);
}

export async function DELETE(req: NextRequest) {
  return deleteProfessionalMe(req);
}
