import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import { updateAuthSchema } from "@/app/types/auth";

const clientDetailSelect =
  "id, full_name, email, phone, avatar_url, created_at";

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

function getTokenFromRequest(
  req: NextRequest
) {
  return req.cookies.get(
    "sb-access-token"
  )?.value;
}

function getAuthenticatedUserId(
  req: NextRequest
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return verifyAccessToken(token).id;
}

async function getRequesterProfile(
  requesterId: string
) {
  const db = getDatabaseClient();
  const {
    data: profile,
    error,
  } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", requesterId)
    .single();

  if (error || !profile) {
    throw new Error(
      error?.message ||
        "Perfil autenticado não encontrado"
    );
  }

  return profile;
}

async function getClientProfileById(
  clientId: string
) {
  const db = getDatabaseClient();
  const {
    data: profile,
    error,
  } = await db
    .from("profiles")
    .select(clientDetailSelect)
    .eq("id", clientId)
    .eq("role", "client")
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

function getPermissions(args: {
  requesterId: string;
  requesterRole: string;
  clientId: string;
}) {
  const isOwner =
    args.requesterId === args.clientId;
  const isAdmin =
    args.requesterRole === "admin";
  const canManage = isOwner || isAdmin;

  return {
    can_view_contact_phone: canManage,
    can_update_name: canManage,
    can_update_email: canManage,
    can_update_phone: canManage,
    can_update_password: canManage,
    can_delete_account: canManage,
    is_owner: isOwner,
    is_admin: isAdmin,
  };
}

function sanitizeClientProfile(args: {
  client: Awaited<
    ReturnType<typeof getClientProfileById>
  >;
  canViewPhone: boolean;
}) {
  if (!args.client) {
    return null;
  }

  if (args.canViewPhone) {
    return args.client;
  }

  return {
    ...args.client,
    phone: null,
  };
}

export async function GET(
  req: NextRequest,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const requesterId =
      getAuthenticatedUserId(req);

    if (!requesterId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;
    const [requester, client] =
      await Promise.all([
        getRequesterProfile(requesterId),
        getClientProfileById(id),
      ]);

    if (!client) {
      return NextResponse.json(
        {
          error: "Cliente não encontrado",
        },
        { status: 404 }
      );
    }

    const permissions = getPermissions({
      requesterId,
      requesterRole: requester.role,
      clientId: client.id,
    });

    return NextResponse.json({
      client: sanitizeClientProfile({
        client,
        canViewPhone:
          permissions.can_view_contact_phone,
      }),
      permissions,
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

export async function PUT(
  req: NextRequest,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const requesterId =
      getAuthenticatedUserId(req);

    if (!requesterId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;
    const requester =
      await getRequesterProfile(
        requesterId
      );

    const canManage =
      requesterId === id ||
      requester.role === "admin";

    if (!canManage) {
      return NextResponse.json(
        {
          error:
            "Sem permissão para alterar este cliente",
        },
        { status: 403 }
      );
    }

    const client =
      await getClientProfileById(id);

    if (!client) {
      return NextResponse.json(
        {
          error: "Cliente não encontrado",
        },
        { status: 404 }
      );
    }

    const parsedBody =
      updateAuthSchema.safeParse(
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
      full_name,
      phone,
      avatar_url,
    } = parsedBody.data;

    if (
      (email || password) &&
      !supabaseAdmin
    ) {
      return NextResponse.json(
        {
          error:
            "Para alterar email ou senha, configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 503 }
      );
    }

    if (supabaseAdmin && (email || password)) {
      const { error } =
        await supabaseAdmin.auth.admin.updateUserById(
          id,
          {
            email,
            password,
            user_metadata:
              full_name !== undefined
                ? { full_name }
                : undefined,
          }
        );

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    const profileUpdates: Record<
      string,
      string | null
    > = {};

    if (full_name !== undefined) {
      profileUpdates.full_name =
        full_name;
    }

    if (email !== undefined) {
      profileUpdates.email = email;
    }

    if (phone !== undefined) {
      profileUpdates.phone = phone;
    }

    if (avatar_url !== undefined) {
      profileUpdates.avatar_url =
        avatar_url;
    }

    if (
      Object.keys(profileUpdates).length > 0
    ) {
      const db = getDatabaseClient();
      const { error } =
        await db
          .from("profiles")
          .update(profileUpdates)
          .eq("id", id)
          .eq("role", "client");

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    const updatedClient =
      await getClientProfileById(id);

    const permissions = getPermissions({
      requesterId,
      requesterRole: requester.role,
      clientId: id,
    });

    return NextResponse.json({
      message:
        "Cliente atualizado com sucesso",
      client: sanitizeClientProfile({
        client: updatedClient,
        canViewPhone:
          permissions.can_view_contact_phone,
      }),
      permissions,
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

export async function DELETE(
  req: NextRequest,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const requesterId =
      getAuthenticatedUserId(req);

    if (!requesterId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;
    const requester =
      await getRequesterProfile(
        requesterId
      );

    const canManage =
      requesterId === id ||
      requester.role === "admin";

    if (!canManage) {
      return NextResponse.json(
        {
          error:
            "Sem permissão para apagar este cliente",
        },
        { status: 403 }
      );
    }

    const client =
      await getClientProfileById(id);

    if (!client) {
      return NextResponse.json(
        {
          error: "Cliente não encontrado",
        },
        { status: 404 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Para apagar clientes, configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 503 }
      );
    }

    const { error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", id)
        .eq("role", "client");

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 400 }
      );
    }

    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(
        id
      );

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        { status: 400 }
      );
    }

    const response =
      NextResponse.json({
        message:
          "Cliente apagado com sucesso",
      });

    if (requesterId === id) {
      response.cookies.delete(
        "sb-access-token"
      );
      response.cookies.delete(
        "sb-refresh-token"
      );
    }

    return response;
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
