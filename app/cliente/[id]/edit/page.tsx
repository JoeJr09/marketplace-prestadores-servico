import { cookies } from "next/headers";
import {
  notFound,
  redirect,
} from "next/navigation";

import { EditSettingsPanel } from "@/components/e/EditSettingsPanel";
import HeaderCliente from "@/components/e/HeaderCliente";
import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";

type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
};

type CurrentUserProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

const clientSelect =
  "id, full_name, email, phone, avatar_url";

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(
    "sb-access-token"
  )?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyAccessToken(token).id;
  } catch {
    return null;
  }
}

async function getClientProfile(id: string) {
  const db = getDatabaseClient();
  const {
    data: client,
    error,
  } = await db
    .from("profiles")
    .select(clientSelect)
    .eq("id", id)
    .eq("role", "client")
    .single();

  if (error || !client) {
    return null;
  }

  return client as ClientProfile;
}

async function getCurrentUserProfile(
  userId: string | null
) {
  if (!userId) {
    return null;
  }

  const db = getDatabaseClient();
  const {
    data: user,
    error,
  } = await db
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user as CurrentUserProfile;
}

export default async function ClienteEditPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const authenticatedUserId =
    await getAuthenticatedUserId();

  if (!authenticatedUserId) {
    redirect(`/cliente/${id}`);
  }

  const [client, currentUser] =
    await Promise.all([
      getClientProfile(id),
      getCurrentUserProfile(
        authenticatedUserId
      ),
    ]);

  if (!client) {
    notFound();
  }

  if (client.id !== authenticatedUserId) {
    redirect(`/cliente/${client.id}`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#eff5f4_42%,_#dee4e3_100%)] text-text-main">
      <HeaderCliente currentUser={currentUser} />

      <section className="relative overflow-hidden px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,rgba(4,22,39,0.08),rgba(255,220,195,0.22),rgba(239,245,244,0))]" />
        <div className="absolute -left-20 top-16 h-44 w-44 rounded-full bg-brand-peach/35 blur-3xl" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-brand-navy-soft/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <EditSettingsPanel
            client={client}
            startInEditMode
          />
        </div>
      </section>
    </main>
  );
}
