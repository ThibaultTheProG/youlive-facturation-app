"use client";

import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Onglet = { id: string; label: string; icon: LucideIcon };

type CarteOngletsProps = {
  /** Nom accessible de la liste d'onglets (lu par les lecteurs d'écran). */
  libelle: string;
  onglets: Onglet[];
  actif: string;
  onChange: (id: string) => void;
  children: ReactNode;
};

/**
 * Une seule carte portant plusieurs sections : onglets à gauche sur grand écran, en bande
 * défilante au-dessus sur mobile. Les panneaux (`Panneau`) restent montés et sont seulement
 * masqués : un formulaire qui les enjambe garde tous ses champs.
 */
export function CarteOnglets({
  libelle,
  onglets,
  actif,
  onChange,
  children,
}: CarteOngletsProps) {
  const boutons = useRef<Record<string, HTMLButtonElement | null>>({});

  const aller = (index: number) => {
    const cible = onglets[(index + onglets.length) % onglets.length];
    onChange(cible.id);
    boutons.current[cible.id]?.focus();
  };

  const surTouche = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        aller(index + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        aller(index - 1);
        break;
      case "Home":
        e.preventDefault();
        aller(0);
        break;
      case "End":
        e.preventDefault();
        aller(onglets.length - 1);
        break;
    }
  };

  return (
    <div className="grid overflow-clip rounded-2xl border border-gray-200 bg-white shadow-sm md:min-h-[calc(100vh-11rem)] md:grid-cols-[15rem_minmax(0,1fr)]">
      <div
        role="tablist"
        aria-label={libelle}
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-gray-100 bg-gray-50/70 p-2 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-3"
      >
        {onglets.map(({ id, label, icon: Icon }, index) => {
          const estActif = id === actif;
          return (
            <button
              key={id}
              ref={(el) => {
                boutons.current[id] = el;
              }}
              type="button"
              role="tab"
              id={`onglet-${id}`}
              aria-selected={estActif}
              aria-controls={`panneau-${id}`}
              tabIndex={estActif ? 0 : -1}
              onClick={() => onChange(id)}
              onKeyDown={(e) => surTouche(e, index)}
              className={cn(
                "group relative flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium",
                "outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60",
                estActif
                  ? "bg-[#fef3e8] text-[#b35a10]"
                  : "text-gray-600 hover:bg-white hover:text-gray-900",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute rounded-full bg-[#E07C24] transition-opacity duration-150",
                  "inset-x-3 bottom-0 h-[3px] md:inset-x-auto md:left-0 md:top-1/2 md:bottom-auto md:h-5 md:w-[3px] md:-translate-y-1/2 md:rounded-l-none",
                  estActif ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  estActif
                    ? "text-[#E07C24]"
                    : "text-gray-400 group-hover:text-gray-600",
                )}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <div className="min-w-0 p-5 md:p-8">{children}</div>
    </div>
  );
}

type PanneauProps = {
  id: string;
  actif: string;
  titre: string;
  description?: string;
  icon: LucideIcon;
  /** Élément aligné à droite de l'en-tête (badge, sélecteur…). */
  aside?: ReactNode;
  children: ReactNode;
};

export function Panneau({
  id,
  actif,
  titre,
  description,
  icon: Icon,
  aside,
  children,
}: PanneauProps) {
  return (
    <section
      role="tabpanel"
      id={`panneau-${id}`}
      aria-labelledby={`onglet-${id}`}
      hidden={id !== actif}
      className="space-y-6"
    >
      <header className="flex items-start gap-3 border-b border-gray-100 pb-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fef3e8]">
          <Icon className="h-5 w-5 text-[#E07C24]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-900">{titre}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
