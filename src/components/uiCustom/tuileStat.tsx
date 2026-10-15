import type { LucideIcon } from "lucide-react";

/** Tuile de synthèse : une icône, un titre et une valeur déjà formatée. */
export function TuileStat({ icone: Icone, titre, valeur }: { icone: LucideIcon; titre: string; valeur: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef3e8]">
        <Icone className="h-5 w-5 text-[#E07C24]" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500">{titre}</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900">{valeur}</p>
      </div>
    </div>
  );
}
