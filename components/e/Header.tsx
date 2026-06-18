"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getProfessionalSlug } from "@/app/lib/professional-slug";

type CurrentUser = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "client" | "professional" | "admin";
};

type MeResponse = {
  user?: CurrentUser;
};

type ProfessionalMeResponse = {
  professional?: {
    business_name: string | null;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getProfileHref(
  user: CurrentUser,
  professionalSlug: string | null,
) {
  if (user.role === "professional") {
    return professionalSlug
      ? `/prestador/${professionalSlug}`
      : "/prestador";
  }

  if (user.role === "admin") {
    return "/admin";
  }

  return `/cliente/${user.id}`;
}

function getProfessionalServicesHref(
  user: CurrentUser | null,
  professionalSlug: string | null,
) {
  if (
    user?.role !== "professional" ||
    !professionalSlug
  ) {
    return null;
  }

  return `/prestador/${professionalSlug}/service-management`;
}

export default function Header() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [professionalSlug, setProfessionalSlug] =
    useState<string | null>(null);

  useEffect(() => {
    let shouldUpdate = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as MeResponse;

        if (shouldUpdate && data.user) {
          if (
            data.user.role ===
            "professional"
          ) {
            const professionalResponse =
              await fetch(
                "/api/auth/me/professional",
                {
                  credentials:
                    "include",
                },
              );

            if (professionalResponse.ok) {
              const professionalData =
                (await professionalResponse.json()) as ProfessionalMeResponse;

              if (
                shouldUpdate &&
                professionalData.professional
              ) {
                setProfessionalSlug(
                  getProfessionalSlug(
                    professionalData.professional,
                  ),
                );
              }
            }
          }

          if (shouldUpdate) {
            setCurrentUser(data.user);
          }
        }
      } catch {
        if (shouldUpdate) {
          setCurrentUser(null);
        }
      }
    }

    loadCurrentUser();

    return () => {
      shouldUpdate = false;
    };
  }, []);

  const initials = currentUser
    ? getInitials(currentUser.full_name)
    : "";
  const profileHref = currentUser
    ? getProfileHref(
        currentUser,
        professionalSlug,
      )
    : "/login";
  const clientDirectoryHref = currentUser
    ? "/cliente"
    : "/login";
  const professionalServicesHref =
    getProfessionalServicesHref(
      currentUser,
      professionalSlug,
    );
  const showFavoritesEntry =
    currentUser?.role === "client";
  const showClientOrdersEntry =
    currentUser?.role === "client";

  return (
    <header className="border-b border-acode-panel-strong/60 bg-acode-header">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
        <nav className="flex items-center gap-5">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="rounded-md text-brand-navy hover:bg-acode-panel"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[320px] border-r border-acode-panel-strong bg-acode-header p-0"
            >
              <SheetHeader className="border-b border-acode-panel-strong/60 p-6">
                <SheetTitle className="text-xl font-black tracking-[-0.05em] text-brand-navy">
                  Acode Aqui
                </SheetTitle>
              </SheetHeader>

              <nav className="grid gap-2 p-4">
                <SheetClose asChild>
                  <Link
                    href="/"
                    className="rounded-md px-4 py-3 text-sm font-extrabold text-brand-navy transition hover:bg-acode-panel"
                  >
                    Início
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/prestador"
                    className="rounded-md px-4 py-3 text-sm font-extrabold text-brand-navy transition hover:bg-acode-panel"
                  >
                    Encontre prestadores de serviço
                  </Link>
                </SheetClose>
                {showFavoritesEntry ? (
                  <SheetClose asChild>
                    <Link
                      href="/prestador?favorites=1"
                      className="rounded-md px-4 py-3 text-sm font-extrabold text-brand-navy transition hover:bg-acode-panel"
                    >
                      Favoritos
                    </Link>
                  </SheetClose>
                ) : null}
                {showClientOrdersEntry ? (
                  <SheetClose asChild>
                    <Link
                      href="/cliente/pedidos"
                      className="rounded-md px-4 py-3 text-sm font-extrabold text-brand-navy transition hover:bg-acode-panel"
                    >
                      Meus pedidos
                    </Link>
                  </SheetClose>
                ) : null}
                <SheetClose asChild>
                  <Link
                    href={clientDirectoryHref}
                    className="rounded-md px-4 py-3 text-sm font-extrabold text-brand-navy transition hover:bg-acode-panel"
                  >
                    Encontre clientes
                  </Link>
                </SheetClose>
                {currentUser ? (
                  <SheetClose asChild>
                    <Link
                      href={profileHref}
                      className="rounded-md px-4 py-3 text-sm font-extrabold text-brand-navy transition hover:bg-acode-panel"
                    >
                      Meu perfil
                    </Link>
                  </SheetClose>
                ) : null}
                {professionalServicesHref ? (
                  <SheetClose asChild>
                    <Link
                      href={professionalServicesHref}
                      className="rounded-md px-4 py-3 text-sm font-extrabold text-brand-navy transition hover:bg-acode-panel"
                    >
                      Serviços
                    </Link>
                  </SheetClose>
                ) : null}
              </nav>

              <SheetFooter className="border-t border-acode-panel-strong/60 p-4">
                {currentUser ? (
                  <SheetClose asChild>
                    <Link
                      href={profileHref}
                      className="flex items-center gap-3 rounded-md bg-white p-3 text-brand-navy"
                    >
                      {currentUser.avatar_url ? (
                        <span
                          className="block size-10 rounded-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${currentUser.avatar_url})`,
                          }}
                        />
                      ) : (
                        <span className="flex size-10 items-center justify-center rounded-full bg-brand-navy text-xs font-black text-white">
                          {initials}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-[0.18em] text-text-subtle">
                          Perfil
                        </span>
                        <span className="block truncate text-sm font-black">
                          {currentUser.full_name}
                        </span>
                      </span>
                    </Link>
                  </SheetClose>
                ) : (
                  <div className="grid gap-3">
                    <SheetClose asChild>
                      <Button
                        asChild
                        variant="brand"
                        className="rounded-md"
                      >
                        <Link href="/login">
                          Login cliente
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        asChild
                        variant="surface"
                        className="rounded-md"
                      >
                        <Link href="/login/professional">
                          Login prestador
                        </Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="text-xl font-black tracking-[-0.05em] text-brand-navy"
          >
            Acode Aqui
          </Link>
          <Link
            href="/prestador"
            className="hidden text-sm font-medium text-text-muted transition-colors hover:text-brand-navy sm:inline-flex"
          >
            Encontre prestadores de serviço
          </Link>
          <Link
            href={clientDirectoryHref}
            className="hidden text-sm font-medium text-text-muted transition-colors hover:text-brand-navy md:inline-flex"
          >
            Encontre clientes
          </Link>
          {professionalServicesHref ? (
            <Link
              href={professionalServicesHref}
              className="hidden text-sm font-medium text-text-muted transition-colors hover:text-brand-navy md:inline-flex"
            >
              Serviços
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <Link
              href={profileHref}
              className="flex items-center gap-3 rounded-full border border-acode-panel-strong bg-white px-2 py-1.5 text-brand-navy transition hover:border-brand-navy/30"
              aria-label="Abrir perfil"
            >
              {currentUser.avatar_url ? (
                <span
                  className="block size-10 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${currentUser.avatar_url})`,
                  }}
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-navy text-xs font-black text-white">
                  {initials}
                </span>
              )}
              <span className="hidden max-w-32 truncate text-sm font-bold sm:block">
                {currentUser.full_name}
              </span>
            </Link>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden font-extrabold text-brand-navy hover:bg-transparent sm:inline-flex"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                variant="brand"
                size="lg"
                className="h-10 rounded-md px-6 text-sm font-extrabold"
              >
                <Link href="/register/professional">
                  Quero anunciar serviços
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
