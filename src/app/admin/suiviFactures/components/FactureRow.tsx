import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FactureDetaillee } from "@/lib/types";

interface FactureRowProps {
  facture: FactureDetaillee;
  updateStatut: (factureId: number, newStatut: string, numero: string, created_at: string) => Promise<void>;
}

export const FactureRow = ({ facture, updateStatut }: FactureRowProps) => {
  return (
    <TableRow key={facture.id}>
      <TableCell>
        {facture.conseiller.prenom} {facture.conseiller.nom}
      </TableCell>
      <TableCell>{facture.numero}</TableCell>
      <TableCell>{facture.type}</TableCell>
      <TableCell>{facture.retrocession.toLocaleString()} €</TableCell>
      <TableCell>{facture.propriete?.numero_mandat ? String(facture.propriete.numero_mandat).trim() : "N/A"}</TableCell>
      <TableCell>
        {facture.date_signature 
          ? new Date(facture.date_signature).toLocaleDateString('fr-FR')
          : "N/A"
        }
      </TableCell>
      <TableCell>{facture.statut_envoi || "non envoyée"}</TableCell>
      <TableCell>{facture.statut_paiement}</TableCell>
      <TableCell>
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
        </div>
      </TableCell>
    </TableRow>
  );
};

export default FactureRow; 