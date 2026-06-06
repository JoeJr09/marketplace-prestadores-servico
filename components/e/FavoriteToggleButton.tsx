"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FavoriteToggleButtonProps = {
  active: boolean;
  pending?: boolean;
  onClick: () => void;
};

export function FavoriteToggleButton({
  active,
  pending = false,
  onClick,
}: FavoriteToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={onClick}
      disabled={pending}
      aria-pressed={active}
      aria-label={
        active
          ? "Remover dos favoritos"
          : "Adicionar aos favoritos"
      }
      className={cn(
        "rounded-full border border-acode-panel-strong bg-white/90 text-brand-navy shadow-[0_12px_30px_rgba(4,22,39,0.08)] hover:bg-white",
        active &&
          "border-yellow-400/70 bg-yellow-400/15 text-yellow-500",
      )}
    >
      <Star
        className={cn(
          "size-5 transition-colors",
          active
            ? "fill-yellow-400 text-yellow-500"
            : "fill-transparent text-brand-navy",
        )}
      />
    </Button>
  );
}
