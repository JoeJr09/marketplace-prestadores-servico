import {
  notFound,
  redirect,
} from "next/navigation";

import {
  getAuthenticatedPortalUser,
  getProfessionalPortalProfileByBusinessName,
  mapPortalProfileToEdit,
} from "@/app/lib/professional-portal";
import { ProfessionalProfileSettingsPanel } from "@/components/e/ProfessionalProfileSettingsPanel";
import { ProfessionalPortalShell } from "@/components/professionals/ProfessionalPortalShell";

export default async function PrestadorEditPage(
  props: PageProps<
    "/prestador/[businessName]/edit"
  >,
) {
  const { businessName } =
    await props.params;
  const authenticatedUser =
    await getAuthenticatedPortalUser();

  if (!authenticatedUser) {
    redirect("/login/professional");
  }

  const professional =
    await getProfessionalPortalProfileByBusinessName(
      decodeURIComponent(
        businessName,
      ),
    );

  if (!professional) {
    notFound();
  }

  const canManage =
    authenticatedUser.id ===
      professional.profile.id ||
    authenticatedUser.role === "admin";

  if (!canManage) {
    redirect(
      `/prestador/${professional.business_name}`,
    );
  }

  return (
    <ProfessionalPortalShell
      professional={professional}
      activeItem="profile"
    >
      <ProfessionalProfileSettingsPanel
        professional={mapPortalProfileToEdit(
          professional,
        )}
      />
    </ProfessionalPortalShell>
  );
}
