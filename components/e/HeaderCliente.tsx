import Link from "next/link";

import { Button } from "@/components/ui/button";

type HeaderProps = {
  currentUser?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function HeaderCliente({ currentUser }: HeaderProps) {
  const initials = currentUser ? getInitials(currentUser.full_name) : null;

  return (
    <header className="relative overflow-hidden border-b border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(239,245,244,0.94),rgba(222,228,227,0.92))]">
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_left_top,rgba(255,220,195,0.28),transparent_42%)]" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 sm:px-10 lg:px-14">
        <div>
          <Link
            href="/cliente"
            className="text-lg font-black tracking-[-0.04em] text-brand-navy sm:text-2xl"
          >
            Clientes
          </Link>
          <p className="mt-1 text-sm text-text-muted">
            Explore os perfis públicos dos clientes da plataforma.
          </p>
        </div>

        {currentUser ? (
          <Button
            asChild
            variant="surface"
            size="lg"
            className="h-auto rounded-2xl border-white/70 bg-white/80 px-3 py-2 shadow-[0_16px_48px_rgba(4,22,39,0.08)]"
          >
            <Link
              href={`/cliente/${currentUser.id}`}
              className="flex items-center gap-3"
            >
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-navy text-sm font-black text-white">
                  {initials}
                </span>
              )}
              <span className="text-left">
                <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
                  Meu Perfil
                </span>
                <span className="block max-w-40 truncate text-sm font-bold text-brand-navy">
                  {currentUser.full_name}
                </span>
              </span>
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
