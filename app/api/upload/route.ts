import { NextResponse, type NextRequest } from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

const STORAGE_BUCKETS = {
  avatars: "avatars",
  services: "service_images",
} as const;

const BUCKET_ALIASES: Record<string, string> = {
  avatars: STORAGE_BUCKETS.avatars,
  services: STORAGE_BUCKETS.services,
  service_images: STORAGE_BUCKETS.services,
};

const ALLOWED_BUCKETS = Object.keys(BUCKET_ALIASES);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getTokenFromRequest(req: NextRequest) {
  return req.cookies.get("sb-access-token")?.value;
}

function getAuthenticatedUserId(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  try {
    return verifyAccessToken(token).id;
  } catch {
    return null;
  }
}

function resolveBucketName(bucket: string | null) {
  if (!bucket) {
    return null;
  }

  return BUCKET_ALIASES[bucket] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedBucket = formData.get("bucket") as string | null;
    const bucket = resolveBucketName(requestedBucket);

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (!bucket) {
      return NextResponse.json(
        { error: `Bucket inválido. Use: ${ALLOWED_BUCKETS.join(", ")}` },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo inválido. Use: JPEG, PNG, WEBP ou GIF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 5MB" },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const db = supabaseAdmin ?? supabase;

    const { error: uploadError } = await db.storage.from(bucket).upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: urlData } = db.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json(
      {
        message: "Upload realizado com sucesso",
        url: urlData.publicUrl,
        path: fileName,
        bucket,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = (await req.json()) as {
      path?: string;
      bucket?: string;
    };

    const path = body.path;
    const bucket = resolveBucketName(body.bucket ?? null);

    if (!path || !bucket) {
      return NextResponse.json(
        { error: "path e bucket são obrigatórios" },
        { status: 400 },
      );
    }

    if (!path.startsWith(userId)) {
      return NextResponse.json(
        { error: "Sem permissão para deletar este arquivo" },
        { status: 403 },
      );
    }

    const db = supabaseAdmin ?? supabase;
    const { error } = await db.storage.from(bucket).remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Arquivo deletado com sucesso" });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
