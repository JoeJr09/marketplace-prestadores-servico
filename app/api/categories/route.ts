import { NextResponse } from "next/server";

import { getServiceCategories } from "@/app/lib/professional-services";

export async function GET() {
  try {
    const categories = await getServiceCategories();

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar as categorias",
      },
      { status: 500 },
    );
  }
}
