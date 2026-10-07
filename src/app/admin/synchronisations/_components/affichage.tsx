import { Loader2 } from "lucide-react";
import {
  LIBELLES_STATUT,
  type PassageSync,
  type StatutSync,
} from "@/lib/synchronisations";

const STYLES_STATUT: Record<StatutSync, string> = {
  en_cours: "bg-blue-50 text-blue-700 border-blue-200",
  succes: "bg-green-50 text-green-700 border-green-200",
  avec_erreurs: "bg-amber-50 text-amber-800 border-amber-200",
  echec: "bg-red-50 text-red-700 border-red-200",
  interrompue: "bg-red-50 text-red-700 border-red-200",
};

export function BadgeStatut({ statut }: { statut: StatutSync }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STYLES_STATUT[statut]}`}
    >
      {statut === "en_cours" && <Loader2 className="h-3 w-3 animate-spin" />}
      {LIBELLES_STATUT[statut]}
    </span>
  );
}

export function formaterDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formaterDuree(ms: number | null): string {
  if (ms === null) return "—";
  const secondes = Math.round(ms / 1000);
  if (secondes < 60) return `${secondes} s`;
  return `${Math.floor(secondes / 60)} min ${String(secondes % 60).padStart(2, "0")} s`;
}

export function origine(passage: PassageSync): string {
  if (passage.declencheur === "cron") return "Automatique (nuit)";
  return passage.auteur || "Lancement manuel";
}

/** Ce qu'il faut comprendre d'un passage qui n'a pas abouti. */
export function explicationErreur(passage: PassageSync): string | null {
  if (passage.statut === "interrompue") {
    return "La synchronisation n'a jamais rendu de résultat : elle a été coupée avant la fin (délai dépassé). Elle peut être relancée.";
  }
  return passage.erreur;
}
