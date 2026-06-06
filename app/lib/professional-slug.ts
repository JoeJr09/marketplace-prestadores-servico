export function normalizeBusinessName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProfessionalSlug(professional: {
  business_name: string | null;
}) {
  return professional.business_name
    ? normalizeBusinessName(professional.business_name)
    : null;
}
