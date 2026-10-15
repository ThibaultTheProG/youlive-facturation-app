import { cn } from "@/lib/utils";
import type { Facture } from "@/lib/types";

const BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium";

/** Libellé affiché pour le type d'une facture : un avoir/ajustement se lit au signe du montant. */
function libelleType(facture: Pick<Facture, "type" | "retrocession">): string {
  if (facture.type === "avoir")
    return parseFloat(facture.retrocession) < 0 ? "Avoir" : "Ajustement";
  if (facture.type === "recrutement") return "Recrutement";
  if (facture.type === "commission") return "Commission";
  return facture.type;
}

export function PastilleType({ facture }: { facture: Facture }) {
  const couleur =
    facture.type === "commission"
      ? "bg-[#fef3e8] text-[#b35a10]"
      : facture.type === "recrutement"
        ? "bg-sky-50 text-sky-700"
        : "bg-gray-100 text-gray-700";
  return <span className={cn(BASE, couleur)}>{libelleType(facture)}</span>;
}

export function PastillePaiement({ statut }: { statut: string }) {
  const paye = statut === "payé";
  return (
    <span
      className={cn(
        BASE,
        paye ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          paye ? "bg-emerald-500" : "bg-amber-500",
        )}
      />
      {paye ? "Payée" : "Non payée"}
    </span>
  );
}

export function PastilleEnvoi({ statut }: { statut: string }) {
  const envoyee = statut === "envoyée";
  return (
    <span
      className={cn(
        BASE,
        envoyee ? "bg-sky-50 text-sky-700" : "bg-gray-100 text-gray-600",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          envoyee ? "bg-sky-500" : "bg-gray-400",
        )}
      />
      {envoyee ? "Envoyée" : "Non envoyée"}
    </span>
  );
}

export function PastilleAnnulee({ date }: { date?: string | null }) {
  return (
    <span className={cn(BASE, "bg-gray-100 text-gray-500")}>
      Annulée{date ? ` le ${new Date(date).toLocaleDateString("fr-FR")}` : ""}
    </span>
  );
}
