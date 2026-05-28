import {
	NextResponse,
	type NextRequest,
} from "next/server";
import { z } from "zod";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
	supabase,
	supabaseAdmin,
} from "@/app/lib/supabase";

const profileSelect =
	"id, full_name, email, phone, avatar_url, role, created_at, updated_at";

const updateAdminSchema = z
	.object({
		full_name: z
			.string()
			.trim()
			.min(3, "Nome deve ter pelo menos 3 caracteres")
			.optional(),
		email: z
			.string()
			.email("Email inválido")
			.transform((value: string) => value.toLowerCase())
			.optional(),
		password: z
			.string()
			.min(8, "Senha deve ter pelo menos 8 caracteres")
			.optional(),
		phone: z
			.preprocess(
				(value: unknown) => {
					if (typeof value === "string") {
						const trimmed = value.trim();

						return trimmed === "" ? null : trimmed;
					}

					return value;
				},
				z
					.union([
						z
							.string()
							.trim()
							.transform((value: string) => value.replace(/\D/g, ""))
							.refine(
								(phone: string) => phone.length === 11,
								"Telefone deve ter exatamente 11 digitos"
							),
						z.null(),
					])
					.optional()
			)
			.optional(),
		avatar_url: z
			.preprocess(
				(value: unknown) => {
					if (typeof value === "string") {
						const trimmed = value.trim();

						return trimmed === "" ? null : trimmed;
					}

					return value;
				},
				z
					.union([
						z.string().url("Avatar deve ser uma URL valida"),
						z.null(),
					])
					.optional()
			)
			.optional(),
	})
	.refine(
		(data: {
			full_name?: string;
			email?: string;
			password?: string;
			phone?: string | null;
			avatar_url?: string | null;
		}) => Object.values(data).some((value) => value !== undefined),
		{
			message: "Informe ao menos um campo para atualizacao",
		}
	);

function getDatabaseClient() {
	return supabaseAdmin ?? supabase;
}

function getTokenFromRequest(req: NextRequest) {
	return req.cookies.get("sb-access-token")?.value;
}

function getAuthenticatedUserId(req: NextRequest) {
	const token = getTokenFromRequest(req);

	if (!token) {
		return null;
	}

	return verifyAccessToken(token).id;
}

async function getAuthenticatedAdmin(req: NextRequest) {
	const userId = getAuthenticatedUserId(req);

	if (!userId) {
		return null;
	}

	const db = getDatabaseClient();
	const { data: profile, error } = await db
		.from("profiles")
		.select(profileSelect)
		.eq("id", userId)
		.single();

	if (error || !profile || profile.role !== "admin") {
		return null;
	}

	return profile;
}

async function getAdminProfileById(id: string) {
	const db = getDatabaseClient();
	const { data: profile, error } = await db
		.from("profiles")
		.select(profileSelect)
		.eq("id", id)
		.eq("role", "admin")
		.single();

	if (error || !profile) {
		throw new Error(error?.message || "Administrador não encontrado");
	}

	return profile;
}

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const admin = await getAuthenticatedAdmin(req);

		if (!admin) {
			return NextResponse.json(
				{ error: "Acesso negado" },
				{ status: 403 }
			);
		}

		const { id } = await context.params;
		const adminProfile = await getAdminProfileById(id);

		return NextResponse.json({ admin: adminProfile });
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: "Administrador não encontrado",
			},
			{ status: 404 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const admin = await getAuthenticatedAdmin(req);

		if (!admin) {
			return NextResponse.json(
				{ error: "Acesso negado" },
				{ status: 403 }
			);
		}

		const { id } = await context.params;
		const parsedBody = updateAdminSchema.safeParse(await req.json());

		if (!parsedBody.success) {
			return NextResponse.json(
				{
					error: "Dados inválidos",
					details: parsedBody.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		if (!supabaseAdmin && (parsedBody.data.email || parsedBody.data.password)) {
			return NextResponse.json(
				{
					error:
						"Configure SUPABASE_SERVICE_ROLE_KEY para alterar email ou senha via backend.",
				},
				{ status: 503 }
			);
		}

		const { full_name, email, password, phone, avatar_url } = parsedBody.data;

		if (supabaseAdmin && (email || password || full_name !== undefined)) {
			const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
				email,
				password,
				user_metadata:
					full_name !== undefined ? { full_name } : undefined,
			});

			if (error) {
				return NextResponse.json(
					{ error: error.message },
					{ status: 400 }
				);
			}
		}

		const profileUpdates: Record<string, string | null> = {};

		if (full_name !== undefined) {
			profileUpdates.full_name = full_name;
		}

		if (email !== undefined) {
			profileUpdates.email = email;
		}

		if (phone !== undefined) {
			profileUpdates.phone = phone;
		}

		if (avatar_url !== undefined) {
			profileUpdates.avatar_url = avatar_url;
		}

		if (Object.keys(profileUpdates).length > 0) {
			const db = getDatabaseClient();
			const { error } = await db
				.from("profiles")
				.update(profileUpdates)
				.eq("id", id)
				.eq("role", "admin");

			if (error) {
				return NextResponse.json(
					{ error: error.message },
					{ status: 400 }
				);
			}
		}

		const adminProfile = await getAdminProfileById(id);

		return NextResponse.json({
			message: "Administrador atualizado com sucesso",
			admin: adminProfile,
		});
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: "Administrador não encontrado",
			},
			{ status: 404 }
		);
	}
}

export async function DELETE(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const admin = await getAuthenticatedAdmin(req);

		if (!admin) {
			return NextResponse.json(
				{ error: "Acesso negado" },
				{ status: 403 }
			);
		}

		if (!supabaseAdmin) {
			return NextResponse.json(
				{
					error:
						"Configure SUPABASE_SERVICE_ROLE_KEY para apagar administradores via backend.",
				},
				{ status: 503 }
			);
		}

		const { id } = await context.params;

		await getAdminProfileById(id);

		const { error: profileError } = await supabaseAdmin
			.from("profiles")
			.delete()
			.eq("id", id)
			.eq("role", "admin");

		if (profileError) {
			return NextResponse.json(
				{
					error: profileError.message,
				},
				{ status: 400 }
			);
		}

		const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

		if (authError) {
			return NextResponse.json(
				{
					error: authError.message,
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({
			message: "Administrador apagado com sucesso",
		});
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: "Administrador não encontrado",
			},
			{ status: 404 }
		);
	}
}
