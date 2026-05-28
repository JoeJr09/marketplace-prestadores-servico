import {
	NextResponse,
	type NextRequest,
} from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

const ALLOWED_BUCKETS = ["avatars", "services"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getTokenFromRequest(req: NextRequest) {
	return req.cookies.get("sb-access-token")?.value;
}

function getAuthenticatedUserId(req: NextRequest) {
	const token = getTokenFromRequest(req);

	if (!token) return null;

	try {
		return verifyAccessToken(token).id;
	} catch {
		return null;
	}
}

// POST /api/upload
// Form data: { file: File, bucket: "avatars" | "services" }
export async function POST(req: NextRequest) {
	try {
		// 1. Verifica autenticação
		const userId = getAuthenticatedUserId(req);

		if (!userId) {
			return NextResponse.json(
				{ error: "Não autenticado" },
				{ status: 401 }
			);
		}

		// 2. Pega o arquivo do form data
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const bucket = formData.get("bucket") as string | null;

		if (!file) {
			return NextResponse.json(
				{ error: "Nenhum arquivo enviado" },
				{ status: 400 }
			);
		}

		// 3. Valida o bucket
		if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
			return NextResponse.json(
				{ error: `Bucket inválido. Use: ${ALLOWED_BUCKETS.join(", ")}` },
				{ status: 400 }
			);
		}

		// 4. Valida o tipo do arquivo
		if (!ALLOWED_TYPES.includes(file.type)) {
			return NextResponse.json(
				{ error: "Tipo de arquivo inválido. Use: JPEG, PNG, WEBP ou GIF" },
				{ status: 400 }
			);
		}

		// 5. Valida o tamanho do arquivo
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: "Arquivo muito grande. Máximo: 5MB" },
				{ status: 400 }
			);
		}

		// 6. Gera um nome único para o arquivo
		const extension = file.name.split(".").pop();
		const fileName = `${userId}/${Date.now()}.${extension}`;

		// 7. Converte o arquivo para buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = new Uint8Array(arrayBuffer);

		// 8. Faz upload para o Supabase Storage
		const db = supabaseAdmin ?? supabase;
		const { error: uploadError } = await db.storage
			.from(bucket)
			.upload(fileName, buffer, {
				contentType: file.type,
				upsert: true,
			});

		if (uploadError) {
			return NextResponse.json(
				{ error: uploadError.message },
				{ status: 400 }
			);
		}

		// 9. Pega a URL pública da imagem
		const { data: urlData } = db.storage
			.from(bucket)
			.getPublicUrl(fileName);

		return NextResponse.json(
			{
				message: "Upload realizado com sucesso",
				url: urlData.publicUrl,
				path: fileName,
				bucket,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{ error: "Erro interno" },
			{ status: 500 }
		);
	}
}

// DELETE /api/upload
// Body: { path: string, bucket: string }
export async function DELETE(req: NextRequest) {
	try {
		const userId = getAuthenticatedUserId(req);

		if (!userId) {
			return NextResponse.json(
				{ error: "Não autenticado" },
				{ status: 401 }
			);
		}

		const { path, bucket } = await req.json();

		if (!path || !bucket) {
			return NextResponse.json(
				{ error: "path e bucket são obrigatórios" },
				{ status: 400 }
			);
		}

		if (!ALLOWED_BUCKETS.includes(bucket)) {
			return NextResponse.json(
				{ error: "Bucket inválido" },
				{ status: 400 }
			);
		}

		// Garante que o usuário só pode deletar seus próprios arquivos
		if (!path.startsWith(userId)) {
			return NextResponse.json(
				{ error: "Sem permissão para deletar este arquivo" },
				{ status: 403 }
			);
		}

		const db = supabaseAdmin ?? supabase;
		const { error } = await db.storage.from(bucket).remove([path]);

		if (error) {
			return NextResponse.json(
				{ error: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json({ message: "Arquivo deletado com sucesso" });
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{ error: "Erro interno" },
			{ status: 500 }
		);
	}
}