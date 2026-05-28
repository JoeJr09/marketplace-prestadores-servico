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

const createAdminSchema = z.object({
	full_name: z
		.string()
		.trim()
		.min(3, "Nome deve ter pelo menos 3 caracteres"),
	email: z
		.string()
		.email("Email inválido")
		.transform((value: string) => value.toLowerCase()),
	password: z
		.string()
		.min(8, "Senha deve ter pelo menos 8 caracteres"),
	phone: z.preprocess(
		(value: unknown) => {
			if (typeof value === "string") {
				const trimmed = value.trim();

				return trimmed === "" ? undefined : trimmed;
			}

			return value;
		},
		z
			.string()
			.trim()
			.transform((value: string) => value.replace(/\D/g, ""))
			.refine(
				(phone: string) => phone.length === 11,
				"Telefone deve ter exatamente 11 digitos"
			)
			.optional()
	).optional(),
	avatar_url: z.preprocess(
		(value: unknown) => {
			if (typeof value === "string") {
				const trimmed = value.trim();

				return trimmed === "" ? undefined : trimmed;
			}

			return value;
		},
		z.string().url("Avatar deve ser uma URL valida").optional()
	).optional(),
});

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

function isDuplicateConstraintError(message: string) {
	return (
		message.includes("duplicate key value") ||
		message.includes("profiles_pkey") ||
		message.includes("profiles_email_key")
	);
}

export async function GET(req: NextRequest) {
	try {
		const admin = await getAuthenticatedAdmin(req);

		if (!admin) {
			return NextResponse.json(
				{ error: "Acesso negado" },
				{ status: 403 }
			);
		}

		const db = getDatabaseClient();
		const { data: admins, error } = await db
			.from("profiles")
			.select(profileSelect)
			.eq("role", "admin")
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json(
				{ error: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json({ admins: admins ?? [] });
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{ error: "Token inválido" },
			{ status: 401 }
		);
	}
}

export async function POST(req: NextRequest) {
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
						"Configure SUPABASE_SERVICE_ROLE_KEY para criar administradores via backend.",
				},
				{ status: 503 }
			);
		}

		const parsedBody = createAdminSchema.safeParse(
			await req.json()
		);

		if (!parsedBody.success) {
			return NextResponse.json(
				{
					error: "Dados inválidos",
					details: parsedBody.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const { email, password, full_name, phone, avatar_url } = parsedBody.data;

		const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
			.from("profiles")
			.select(profileSelect)
			.eq("email", email)
			.maybeSingle();

		if (existingProfileError) {
			return NextResponse.json(
				{ error: existingProfileError.message },
				{ status: 400 }
			);
		}

		if (existingProfile) {
			return NextResponse.json(
				{
					error: "Já existe um perfil cadastrado com este email.",
					conflict: {
						source: "profiles.email",
						profileId: existingProfile.id,
					},
				},
				{ status: 409 }
			);
		}

		const authResult = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				full_name,
				phone,
				role: "admin",
			},
		});

		const { data, error } = authResult;

		if (error || !data.user) {
			return NextResponse.json(
				{
					error: error?.message || "Erro ao criar usuário",
				},
				{ status: 400 }
			);
		}

		const { error: profileError } = await supabaseAdmin
			.from("profiles")
			.upsert(
				{
					id: data.user.id,
					email,
					full_name,
					phone: phone ?? null,
					avatar_url: avatar_url ?? null,
					role: "admin",
				},
				{
					onConflict: "id",
				}
			);

		if (profileError) {
			await supabaseAdmin.auth.admin.deleteUser(data.user.id);

			const duplicateConflict = isDuplicateConstraintError(profileError.message);

			return NextResponse.json(
				{
					error: duplicateConflict
						? "O perfil deste usuário já existe no banco. Isso costuma acontecer quando há trigger ou hook automático criando profiles no Supabase."
						: profileError.message,
					conflict: duplicateConflict
						? {
								source: "profiles.id",
								profileId: data.user.id,
							}
						: undefined,
				},
				{
					status: duplicateConflict ? 409 : 400,
				}
			);
		}

		const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
			.from("profiles")
			.select(profileSelect)
			.eq("id", data.user.id)
			.single();

		if (adminProfileError || !adminProfile) {
			return NextResponse.json(
				{
					message: "Administrador criado com sucesso",
					user: {
						id: data.user.id,
						email,
						full_name,
						phone: phone ?? null,
						avatar_url: avatar_url ?? null,
						role: "admin",
					},
				},
				{ status: 201 }
			);
		}

		return NextResponse.json(
			{
				message: "Administrador criado com sucesso",
				user: adminProfile,
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
