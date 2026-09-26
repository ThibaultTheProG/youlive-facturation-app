import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FactureDetaillee } from "@/lib/types";

interface FactureRowProps {
  facture: FactureDetaillee;
  updateStatut: (factureId: number, newStatut: string, numero: string, created_at: string) => Promise<void>;
  onEditTva: (facture: FactureDetaillee) => void;
  onRemplacer: (facture: FactureDetaillee) => void;
}

export const FactureRow = ({ facture, updateStatut, onEditTva, onRemplacer }: FactureRowProps) => {
  const typeLabel =
    facture.type === "avoir"
      ? Number(facture.retrocession) < 0
        ? "Avoir"
        : "Ajustement"
      : facture.type;
  // Même règle que /api/factures/[id]/remplacer : une facture envoyée ou
  // payée a été émise, elle s'annule par un avoir.
  const remplacable =
    (facture.type === "commission" || facture.type === "recrutement") &&
    facture.statut_envoi !== "envoyée" &&
    facture.statut_paiement !== "payé";
  const pdfButton = (
    <Button
      className="bg-orange-strong text-white hover:bg-orange-light hover:text-black cursor-pointer"
      onClick={() => {
        // Ouvrir la facture PDF dans un nouvel onglet
        const pdfUrl = `/factures/${facture.id}/pdf`;
        window.open(pdfUrl, '_blank');
      }}
    >
      Voir PDF
    </Button>
  );
  return (
    <TableRow key={facture.id} className={facture.annulee ? "text-gray-400" : undefined}>
      <TableCell>
        {facture.conseiller.prenom} {facture.conseiller.nom}
      </TableCell>
      <TableCell>
        <span className={facture.annulee ? "line-through" : undefined}>{facture.numero}</span>
        {facture.remplace && (
          <div className="text-xs text-gray-500">
            remplace {facture.remplace.numero || `#${facture.remplace.id}`}
          </div>
        )}
      </TableCell>
      <TableCell>{typeLabel}</TableCell>
      <TableCell>{facture.retrocession.toLocaleString()} €</TableCell>
      <TableCell>{facture.propriete?.numero_mandat ? String(facture.propriete.numero_mandat).trim() : "N/A"}</TableCell>
      <TableCell>
        {facture.date_signature 
          ? new Date(facture.date_signature).toLocaleDateString('fr-FR')
          : "N/A"
        }
      </TableCell>
      <TableCell>{facture.statut_envoi || "non envoyée"}</TableCell>
      <TableCell>
        {facture.annulee
          ? `annulée le ${new Date(facture.annulee_le!).toLocaleDateString('fr-FR')}`
          : facture.statut_paiement}
      </TableCell>
      <TableCell>
        {facture.date_paiement
          ? new Date(facture.date_paiement).toLocaleDateString('fr-FR')
          : "N/A"
        }
      </TableCell>
      <TableCell>
        {facture.annulee ? (
          <div className="flex space-x-2">{pdfButton}</div>
        ) : (
        <div className="flex space-x-2">
          {facture.statut_paiement !== "payé" ? (
            <Button
              className="bg-green-500 text-white hover:bg-green-700 cursor-pointer"
              onClick={() => updateStatut(facture.id, "payé", facture.numero, facture.created_at)}
            >
              Marquer comme payé
            </Button>
          ) : (
            <Button
              className="bg-red-500 text-white hover:bg-red-700 cursor-pointer"
              onClick={() => updateStatut(facture.id, "non payé", facture.numero, facture.created_at)}
            >
              Annuler
            </Button>
          )}

          {pdfButton}

          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => onEditTva(facture)}
          >
            Modifier TVA
          </Button>

          {remplacable && (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => onRemplacer(facture)}
            >
              Annuler et remplacer
            </Button>
          )}
        </div>
        )}
      </TableCell>
    </TableRow>
  );
};

export default FactureRow; 