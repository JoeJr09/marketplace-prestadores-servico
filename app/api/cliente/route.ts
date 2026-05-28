import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";

const clientListSelect =
  "id, full_name, email, avatar_url, created_at";

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(
      "sb-access-token"
    )?.value;

    if (token) {
      verifyAccessToken(token);
    }

    const db = getDatabaseClient();
    const {
      data: clients,
      error,
    } = await db
      .from("profiles")
      .select(clientListSelect)
      .eq("role", "client")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      clients: clients ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Token inválido",
      },
      { status: 401 }
    );
  }
}
