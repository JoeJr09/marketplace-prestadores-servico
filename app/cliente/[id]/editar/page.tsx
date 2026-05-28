import { redirect } from "next/navigation";

export default async function ClienteEditPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  redirect(`/cliente/${id}/edit`);
}
