"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type EntreeSommaire = { id: string; titre: string };

/**
 * Sommaire de la page : colonne fixe sur grand écran, liste déroulante en haut sur
 * mobile. La section visible à l'écran est mise en évidence au fil du défilement.
 */
export function Sommaire({ entrees }: { entrees: EntreeSommaire[] }) {
  const [actif, setActif] = useState(entrees[0]?.id ?? "");

  useEffect(() => {
    const observateur = new IntersectionObserver(
      (observees) => {
        const visible = observees.filter((o) => o.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActif(visible.target.id);
      },
      { rootMargin: "-96px 0px -65% 0px" }
    );
    entrees.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observateur.observe(element);
    });
    return () => observateur.disconnect();
  }, [entrees]);

  return (
    <>
      <details className="rounded-xl border border-gray-200 bg-white shadow-sm lg:hidden">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-gray-900">Sommaire</summary>
        <ul className="space-y-0.5 border-t border-gray-100 p-2">
          {entrees.map(({ id, titre }) => (
            <li key={id}>
              <a href={`#${id}`} className="block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                {titre}
              </a>
            </li>
          ))}
        </ul>
      </details>

      <nav aria-label="Sommaire de la documentation" className="sticky top-6 hidden self-start lg:block">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">Sommaire</p>
        <ul className="space-y-0.5">
          {entrees.map(({ id, titre }) => {
            const estActif = id === actif;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={estActif ? "location" : undefined}
                  className={cn(
                    "relative block rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E07C24]/60",
                    estActif ? "bg-[#fef3e8] font-medium text-[#b35a10]" : "text-gray-600 hover:bg-white hover:text-gray-900"
                  )}
                >
                  {estActif && <span aria-hidden className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#E07C24]" />}
                  {titre}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
