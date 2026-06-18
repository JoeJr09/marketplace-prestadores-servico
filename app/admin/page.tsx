import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminConsole } from "@/components/admin/AdminConsole";
import Footer from "@/components/e/Footer";
import Header from "@/components/e/Header";
import LogoutButton from "@/components/e/LogoutButton";
import { verifyAccessToken } from "@/app/lib/jwt";
import { supabase, supabaseAdmin } from "@/app/lib/supabase";

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const db = getDatabaseClient();
    const { data, error } = await db
      .from("profiles")
      .select("id, role")
      .eq("id", payload.id)
      .single();

    if (error || !data || data.role !== "admin") {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login/admin");
  }

  return (
    <div className="min-h-screen bg-acode-mist text-text-main">
      <Header />

      <main className="px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex justify-end">
            <LogoutButton accountType="admin" />
          </div>

          <AdminConsole />
        </div>
      </main>

      <Footer />
    </div>
  );
}
