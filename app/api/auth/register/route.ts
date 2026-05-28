import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { supabaseAdmin } from "@/app/lib/supabase";
import { registerAuthSchema } from "@/app/types/auth";

const profileSelect =
  "id, email, full_name, phone, role";

function isDuplicateConstraintError(
  message: string
) {
  return (
    message.includes(
      "duplicate key value"
    ) ||
    message.includes("profiles_pkey") ||
    message.includes("profiles_email_key")
  );
}

export async function POST(req: NextRequest) {
  try {
    const parsedBody =
      registerAuthSchema.safeParse(
        await req.json()
      );

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details:
            parsedBody.error.flatten()
              .fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      confirm_password: _confirmPassword,
      full_name,
      phone,
      role,
    } = parsedBody.data;

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Configure SUPABASE_SERVICE_ROLE_KEY para cadastrar usuários via backend.",
        },
        { status: 503 }
      );
    }

    const {
      data: existingProfileByEmail,
      error: existingProfileByEmailError,
    } = await supabaseAdmin
      .from("profiles")
      .select(profileSelect)
      .eq("email", email)
      .maybeSingle();

    if (existingProfileByEmailError) {
      return NextResponse.json(
        {
          error:
            existingProfileByEmailError.message,
        },
        { status: 400 }
      );
    }

    if (existingProfileByEmail) {
      return NextResponse.json(
        {
          error:
            "Já existe um perfil cadastrado com este email.",
          conflict: {
            source: "profiles.email",
            profileId:
              existingProfileByEmail.id,
          },
        },
        { status: 409 }
      );
    }

    const authResult =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone,
          role,
        },
      });

    const { data, error } = authResult;

    if (error || !data.user) {
      return NextResponse.json(
        {
          error:
            error?.message ||
            "Erro ao criar usuário",
        },
        { status: 400 }
      );
    }

    const {
      data: existingProfileById,
      error: existingProfileByIdError,
    } = await supabaseAdmin
      .from("profiles")
      .select(profileSelect)
      .eq("id", data.user.id)
      .maybeSingle();

    if (existingProfileByIdError) {
      await supabaseAdmin.auth.admin.deleteUser(
        data.user.id
      );

      return NextResponse.json(
        {
          error:
            existingProfileByIdError.message,
        },
        { status: 400 }
      );
    }

    const { error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            email,
            full_name,
            phone,
            role,
          },
          {
            onConflict: "id",
          }
        );

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(
        data.user.id
      );

      const duplicateConflict =
        isDuplicateConstraintError(
          profileError.message
        );

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
          status: duplicateConflict
            ? 409
            : 400,
        }
      );
    }

    if (role === "professional") {
      const {
        data: existingProfessional,
        error: existingProfessionalError,
      } = await supabaseAdmin
        .from("professionals")
        .select("id, profile_id")
        .eq("profile_id", data.user.id)
        .maybeSingle();

      if (existingProfessionalError) {
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", data.user.id);

        await supabaseAdmin.auth.admin.deleteUser(
          data.user.id
        );

        return NextResponse.json(
          {
            error:
              existingProfessionalError.message,
          },
          { status: 400 }
        );
      }

      if (!existingProfessional) {
        const {
          error: professionalError,
        } = await supabaseAdmin
          .from("professionals")
          .insert({
            profile_id: data.user.id,
          });

        if (professionalError) {
          await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", data.user.id);

          await supabaseAdmin.auth.admin.deleteUser(
            data.user.id
          );

          return NextResponse.json(
            {
              error:
                professionalError.message,
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        message:
          "Usuário criado com sucesso",
        user: {
          id: data.user.id,
          email,
          full_name,
          phone,
          role,
        },
        metadata: {
          profileAutoDetected:
            Boolean(existingProfileById),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro interno",
      },
      { status: 500 }
    );
  }
}
