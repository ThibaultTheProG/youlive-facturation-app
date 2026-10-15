import { TableCell, TableRow } from "@/components/ui/table";
import { FactureDetaillee } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, formatEuros } from "@/utils/formats";
import { PastilleAnnulee, PastilleEnvoi, PastillePaiement, PastilleType } from "@/components/factures/pastilles";
import { ActionsFacture, ActionsFactureProps } from "./ActionsFacture";

type FactureRowProps = Omit<ActionsFactureProps, "avecLibelles">;

export const numeroMandat = (facture: FactureDetaillee) =>
  facture.propriete?.numero_mandat ? String(facture.propriete.numero_mandat).trim() : "N/A";

export const FactureRow = (props: FactureRowProps) => {
  const { facture } = props;
  return (
    <TableRow className={cn("hover:bg-gray-50/60", facture.annulee && "text-gray-400")}>
      <TableCell className="px-3 py-3 font-medium text-gray-900">
        {facture.conseiller.prenom} {facture.conseiller.nom}
      </TableCell>
      <TableCell className="px-3 py-3">
        <span className={cn("whitespace-nowrap", facture.annulee && "line-through")}>
          {facture.numero || <span className="text-gray-400">À attribuer</span>}
        </span>
        {facture.remplace && (
          <div className="text-xs text-gray-500">remplace {facture.remplace.numero || `#${facture.remplace.id}`}</div>
        )}
      </TableCell>
      <TableCell className="px-3 py-3">
        <PastilleType facture={facture} />
      </TableCell>
      <TableCell className="px-3 py-3 text-right font-semibold tabular-nums">{formatEuros(facture.retrocession)}</TableCell>
      <TableCell className="px-3 py-3">{numeroMandat(facture)}</TableCell>
      <TableCell className="whitespace-nowrap px-3 py-3">{formatDate(facture.date_signature)}</TableCell>
      <TableCell className="px-3 py-3">
        <PastilleEnvoi statut={facture.statut_envoi || "non envoyée"} />
      </TableCell>
      <TableCell className="px-3 py-3">
        {facture.annulee ? <PastilleAnnulee date={facture.annulee_le} /> : <PastillePaiement statut={facture.statut_paiement} />}
      </TableCell>
      <TableCell className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">{formatDate(facture.date_paiement)}</TableCell>
      <TableCell className="px-3 py-3">
        <ActionsFacture {...props} />
      </TableCell>
    </TableRow>
  );
};

export default FactureRow;
