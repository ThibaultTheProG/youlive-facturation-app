import { FactureDetaillee } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, formatEuros } from "@/utils/formats";
import { PastilleAnnulee, PastilleEnvoi, PastillePaiement, PastilleType } from "@/components/factures/pastilles";
import { ActionsFacture, ActionsFactureProps } from "./ActionsFacture";
import { numeroMandat } from "./FactureRow";

/** Une facture sur écran étroit : mêmes informations et actions que la ligne du tableau. */
export function FactureCarte(props: Omit<ActionsFactureProps, "avecLibelles">) {
  const { facture } = props as { facture: FactureDetaillee };
  return (
    <li className={cn("space-y-3 p-4", facture.annulee && "text-gray-400")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <PastilleType facture={facture} />
          <p className="mt-2 truncate text-sm font-medium text-gray-900">
            {facture.conseiller.prenom} {facture.conseiller.nom}
          </p>
          <p className={cn("text-xs text-gray-500", facture.annulee && "line-through")}>
            {facture.numero || "Numéro à attribuer"}
            {facture.remplace && ` · remplace ${facture.remplace.numero || `#${facture.remplace.id}`}`}
          </p>
          <p className="text-xs text-gray-500">
            Mandat {numeroMandat(facture)} · signé le {formatDate(facture.date_signature)}
          </p>
        </div>
        <p className="shrink-0 text-lg font-semibold tabular-nums text-gray-900">{formatEuros(facture.retrocession)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PastilleEnvoi statut={facture.statut_envoi || "non envoyée"} />
        {facture.annulee ? <PastilleAnnulee date={facture.annulee_le} /> : <PastillePaiement statut={facture.statut_paiement} />}
        {facture.date_paiement && <span className="text-xs text-gray-500">payée le {formatDate(facture.date_paiement)}</span>}
      </div>
      <ActionsFacture {...props} avecLibelles />
    </li>
  );
}
