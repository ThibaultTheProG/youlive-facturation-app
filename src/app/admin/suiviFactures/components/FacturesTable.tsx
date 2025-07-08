import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FactureDetaillee } from "@/lib/types";
import SortableHeader, { SortDirection } from "./SortableHeader";
import FactureRow from "./FactureRow";

interface FacturesTableProps {
  currentFactures: FactureDetaillee[];
  sortField: string | null;
  sortDirection: SortDirection;
  handleSort: (field: string) => void;
  updateStatut: (factureId: number, newStatut: string, numero: string, created_at: string) => Promise<void>;
}

export const FacturesTable = ({
  currentFactures,
  sortField,
  sortDirection,
  handleSort,
  updateStatut
}: FacturesTableProps) => {
  return (
    <Table>
      <TableCaption>Suivi des paiements des factures</TableCaption>
      <TableHeader>
        <TableRow>
          <SortableHeader 
            title="Conseiller" 
            field="conseiller" 
            currentSortField={sortField} 
            currentSortDirection={sortDirection} 
            onSort={handleSort} 
          />
          <TableHead>N° de facture</TableHead>
          <TableHead>Type</TableHead>
          <SortableHeader 
            title="Montant (€)" 
            field="montant" 
            currentSortField={sortField} 
            currentSortDirection={sortDirection} 
            onSort={handleSort} 
          />
          <TableHead>Numéro de mandat</TableHead>
          <SortableHeader 
            title="Date de signature" 
            field="date_signature" 
            currentSortField={sortField} 
            currentSortDirection={sortDirection} 
            onSort={handleSort} 
          />
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currentFactures.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              Aucune facture trouvée.
            </TableCell>
          </TableRow>
        ) : (
          currentFactures.map((facture) => (
            <FactureRow 
              key={facture.id} 
              facture={facture} 
              updateStatut={updateStatut} 
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default FacturesTable; 