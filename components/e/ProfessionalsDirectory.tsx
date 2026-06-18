"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { getProfessionalSlug } from "@/app/lib/professional-slug";
import { Button } from "@/components/ui/button";
import { FavoriteToggleButton } from "@/components/e/FavoriteToggleButton";
import { FavoritesFilterToggle } from "@/components/e/FavoritesFilterToggle";

type ProfessionalCard = {
  id: string;
  business_name: string | null;
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  avg_rating: number | null;
  total_reviews: number | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
  service_tags: string[];
};

type CurrentUser = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "client" | "professional" | "admin";
};

type MeResponse = {
  user?: CurrentUser;
};

type FavoritesResponse = {
  favorites?: string[];
};

type ProfessionalsDirectoryProps = {
  professionals: ProfessionalCard[];
};

function getDisplayName(professional: ProfessionalCard) {
  return (
    professional.business_name ||
    professional.profile.full_name ||
    "prestador-sem-nome"
  );
}

function getLocation(professional: ProfessionalCard) {
  return [professional.city, professional.country].filter(Boolean).join(", ");
}

function getInitials(name: string) {
  return name
    .split("-")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function updateFavoritesFilter(enabled: boolean) {
  const params = new URLSearchParams(window.location.search);

  if (enabled) {
    params.set("favorites", "1");
  } else {
    params.delete("favorites");
  }

  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  window.history.pushState(null, "", nextUrl);
}

export function ProfessionalsDirectory({
  professionals,
}: ProfessionalsDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const isClientUser = currentUser?.role === "client";

  useEffect(() => {
    let shouldUpdate = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          if (shouldUpdate) {
            setCurrentUser(null);
            setFavorites([]);
            setFavoritesLoaded(true);
          }

          return;
        }

        const data = (await response.json()) as MeResponse;

        if (shouldUpdate && data.user) {
          setCurrentUser(data.user);
        }
      } catch {
        if (shouldUpdate) {
          setCurrentUser(null);
          setFavorites([]);
          setFavoritesLoaded(true);
        }
      }
    }

    loadCurrentUser();

    return () => {
      shouldUpdate = false;
    };
  }, []);

  useEffect(() => {
    let shouldUpdate = true;

    async function loadFavorites() {
      if (!isClientUser) {
        if (shouldUpdate) {
          setFavorites([]);
          setFavoritesLoaded(true);
        }

        return;
      }

      try {
        setFavoritesLoaded(false);

        const response = await fetch("/api/favorites", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar os favoritos");
        }

        const data = (await response.json()) as FavoritesResponse;

        if (shouldUpdate) {
          setFavorites(data.favorites ?? []);
        }
      } catch {
        if (shouldUpdate) {
          setFavorites([]);
        }
      } finally {
        if (shouldUpdate) {
          setFavoritesLoaded(true);
        }
      }
    }

    loadFavorites();

    return () => {
      shouldUpdate = false;
    };
  }, [isClientUser]);

  const showFavoritesOnly =
    searchParams.get("favorites") === "1" && isClientUser;
  const filteredProfessionals = showFavoritesOnly
    ? professionals.filter((professional) => favorites.includes(professional.id))
    : professionals;

  async function toggleFavorite(professionalId: string) {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (!isClientUser) {
      return;
    }

    const isFavorite = favorites.includes(professionalId);

    setPendingIds((currentPendingIds) => [...currentPendingIds, professionalId]);

    setFavorites((currentFavorites) =>
      isFavorite
        ? currentFavorites.filter((favoriteId) => favoriteId !== professionalId)
        : [...currentFavorites, professionalId],
    );

    try {
      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalId,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar o favorito");
      }

      const data = (await response.json()) as FavoritesResponse;
      setFavorites(data.favorites ?? []);
    } catch {
      setFavorites((currentFavorites) =>
        isFavorite
          ? [...currentFavorites, professionalId]
          : currentFavorites.filter((favoriteId) => favoriteId !== professionalId),
      );
    } finally {
      setPendingIds((currentPendingIds) =>
        currentPendingIds.filter((pendingId) => pendingId !== professionalId),
      );
    }
  }

  return (
    <>
      {isClientUser ? (
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <FavoritesFilterToggle
            active={showFavoritesOnly}
            count={favorites.length}
            disabled={!favoritesLoaded}
            onClick={() => updateFavoritesFilter(!showFavoritesOnly)}
          />
          <p className="text-sm text-text-muted">
            {showFavoritesOnly
              ? "Exibindo apenas os prestadores favoritados."
              : "Ative o filtro para ver somente seus favoritos."}
          </p>
        </div>
      ) : null}

      {isClientUser && showFavoritesOnly && !favoritesLoaded ? (
        <section className="rounded-lg bg-white/70 p-8 text-text-muted">
          Carregando favoritos...
        </section>
      ) : null}

      {!(isClientUser && showFavoritesOnly && !favoritesLoaded) &&
      filteredProfessionals.length === 0 ? (
        <section className="rounded-lg bg-white/70 p-8 text-text-muted">
          {showFavoritesOnly
            ? "Você ainda não favoritou nenhum prestador."
            : "Nenhum prestador cadastrado ainda."}
        </section>
      ) : !(isClientUser && showFavoritesOnly && !favoritesLoaded) ? (
        <section className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filteredProfessionals.map((professional) => {
            const displayName = getDisplayName(professional);
            const slug = getProfessionalSlug(professional);
            const location = getLocation(professional);
            const isFavorite = favorites.includes(professional.id);

            return (
              <article
                key={professional.id}
                className="overflow-hidden rounded-lg bg-acode-panel shadow-[0_18px_45px_-36px_rgba(4,22,39,0.7)]"
              >
                <div className="relative flex min-h-64 items-center justify-center bg-[linear-gradient(160deg,#dee4e3_0%,#cbd5e1_52%,#94a3b8_100%)]">
                  {isClientUser ? (
                    <div className="absolute right-4 top-4 z-10">
                      <FavoriteToggleButton
                        active={isFavorite}
                        pending={pendingIds.includes(professional.id)}
                        onClick={() => void toggleFavorite(professional.id)}
                      />
                    </div>
                  ) : null}

                  {professional.profile.avatar_url ? (
                    <div
                      className="h-full min-h-64 w-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${professional.profile.avatar_url})`,
                      }}
                    />
                  ) : (
                    <div className="flex size-28 items-center justify-center rounded-full bg-white/70 text-4xl font-black text-brand-navy">
                      {getInitials(displayName)}
                    </div>
                  )}
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black leading-7 tracking-[-0.05em]">
                        {displayName}
                      </h2>
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-brand-brown">
                        {professional.is_verified ? "verificado" : "em análise"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-brand-navy px-2 py-1 text-xs font-black text-white">
                      <Star className="size-3 fill-white" />
                      {(professional.avg_rating ?? 0).toFixed(1)}
                    </span>
                  </div>

                  {location ? (
                    <p className="flex items-center gap-2 text-sm text-text-muted">
                      <MapPin className="size-4" />
                      {location}
                    </p>
                  ) : null}

                  <p className="min-h-16 text-sm leading-6 text-text-muted">
                    {professional.bio ||
                      "Prestador cadastrado na plataforma, pronto para configurar serviços e receber solicitações."}
                  </p>

                  {professional.service_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {professional.service_tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-brand-navy/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-navy"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-text-subtle">
                    <span>{professional.years_experience ?? 0} anos</span>
                    <span>{professional.total_reviews ?? 0} avaliações</span>
                  </div>

                  {slug ? (
                    <Button
                      asChild
                      variant="brand"
                      className="h-11 w-full rounded-md text-sm font-black"
                    >
                      <Link href={`/prestador/${slug}`}>Ver detalhes</Link>
                    </Button>
                  ) : (
                    <Button
                      variant="surface"
                      className="h-11 w-full rounded-md text-sm font-black"
                      disabled
                    >
                      Nome da empresa pendente
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </>
  );
}
