"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FavoritesFilterToggleProps = {
  active: boolean;
  count: number;
  disabled?: boolean;
  onClick: () => void;
};

export function FavoritesFilterToggle({
  active,
  count,
  disabled = false,
  onClick,
}: FavoritesFilterToggleProps) {
  return (
    <Button
      type="button"
      variant={active ? "brand" : "surface"}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 text-sm font-black tracking-[-0.02em]",
        active
          ? "border-brand-navy"
          : "border-acode-panel-strong bg-white text-brand-navy",
      )}
    >
      <Star
        className={cn(
          "size-4",
          active
            ? "fill-yellow-400 text-yellow-400"
            : "fill-transparent text-brand-navy",
        )}
      />
      <span>Favoritos</span>
      <span
        className={cn(
          "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs",
          active
            ? "bg-white/18 text-white"
            : "bg-brand-navy text-white",
        )}
      >
        {count}
      </span>
    </Button>
  );
}
