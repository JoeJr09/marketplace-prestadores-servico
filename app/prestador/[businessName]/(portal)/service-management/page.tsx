import {
  notFound,
  redirect,
} from "next/navigation";

import {
  getAuthenticatedPortalUser,
  getProfessionalPortalProfileByBusinessName,
  getProfessionalServiceRequests,
} from "@/app/lib/professional-portal";
import { ProfessionalPortalShell } from "@/components/professionals/ProfessionalPortalShell";
import { ServiceManagementWorkspace } from "@/components/professionals/ServiceManagementWorkspace";

function getActiveTab(
  tabValue:
    | string
    | string[]
    | undefined,
) {
  return tabValue === "requests"
    ? "requests"
    : "services";
}

export default async function PrestadorServiceManagementPage(
  props: PageProps<
    "/prestador/[businessName]/service-management"
  >,
) {
  const { businessName } =
    await props.params;
  const searchParams =
    await props.searchParams;
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

  const serviceRequests =
    await getProfessionalServiceRequests(
      professional.professional_id,
    );

  return (
    <ProfessionalPortalShell
      professional={professional}
      activeItem="services"
    >
      <ServiceManagementWorkspace
        professional={professional}
        serviceRequests={
          serviceRequests
        }
        activeTab={getActiveTab(
          searchParams.tab,
        )}
        businessName={
          professional.business_name ??
          decodeURIComponent(
            businessName,
          )
        }
      />
    </ProfessionalPortalShell>
  );
}
