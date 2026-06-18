"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  accountType: "client" | "professional" | "admin";
};

export default function LogoutButton({ accountType }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    const endpoint =
      accountType === "professional"
        ? "/api/auth/logout/professional"
        : "/api/auth/logout";

    try {
      await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="lg"
      className="rounded-md border border-destructive/25 bg-white/90 px-4 font-black uppercase tracking-[0.16em] shadow-[0_18px_45px_-32px_rgba(4,22,39,0.65)]"
      disabled={isLoggingOut}
      onClick={handleLogout}
    >
      <LogOut className="size-4" />
      {isLoggingOut ? "Saindo..." : "Sair"}
    </Button>
  );
}
