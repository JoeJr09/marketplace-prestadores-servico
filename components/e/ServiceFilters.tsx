"use client";

import { useState } from "react";
import { MapPin, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

const categories = ["All Services", "Plumbing", "Electrical", "Cleaning"];

export function ServiceFilters() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <aside className="lg:w-12">
        <Button
          type="button"
          variant="surface"
          size="icon-lg"
          className="rounded-md"
          onClick={() => setIsVisible(true)}
          aria-label="Mostrar filtros"
        >
          <PanelLeftOpen className="size-5" />
        </Button>
      </aside>
    );
  }

  return (
    <aside className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-[-0.03em]">
          Filters
        </h2>
        <Button
          type="button"
          variant="surface"
          size="icon-sm"
          className="rounded-md"
          onClick={() => setIsVisible(false)}
          aria-label="Ocultar filtros"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <section className="space-y-4">
        <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-text-muted">
          Location
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter city or zip"
            className="h-12 w-full rounded-md border-0 bg-acode-panel px-4 pr-10 text-sm text-brand-navy placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-brand-navy/15"
          />
          <MapPin className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-text-muted">
          Service Category
        </h3>
        <div className="grid gap-1">
          {categories.map((category, index) => (
            <label
              key={category}
              className="flex h-12 items-center gap-3 bg-acode-panel/65 px-3 text-sm font-medium text-brand-navy"
            >
              <span
                className={
                  index === 0
                    ? "flex size-4 items-center justify-center bg-brand-navy text-[0.65rem] font-black text-white"
                    : "size-4 border border-acode-panel-strong bg-white"
                }
              >
                {index === 0 ? "✓" : null}
              </span>
              {category}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-text-muted">
          Price Range
        </h3>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex h-10 items-center justify-center bg-acode-panel text-sm font-bold">
            $0
          </div>
          <div className="flex h-10 items-center justify-center bg-acode-panel text-sm font-bold">
            $500+
          </div>
        </div>
        <div className="h-4 bg-white" />
      </section>

      <Button
        variant="brand"
        size="xl"
        className="h-14 w-full rounded-md text-sm font-black"
      >
        Apply Filters
      </Button>
    </aside>
  );
}
