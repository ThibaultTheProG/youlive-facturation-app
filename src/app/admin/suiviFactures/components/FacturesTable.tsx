import { FileSearch } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EnTeteTriable, ENTETE_COLONNE } from "@/components/uiCustom/enTeteTriable";
import { cn } from "@/lib/utils";
import { FactureDetaillee } from "@/lib/types";
import { SortDirection } from "@/hooks/useFacturesFiltering";
import FactureRow from "./FactureRow";
import { FactureCarte } from "./FactureCarte";

interface FacturesTableProps {
  currentFactures: FactureDetaillee[];
  isLoading: boolean;
  /** Vrai quand un filtre est actif : le message d'absence de résultat le dit. */
  filtresActifs: boolean;
  sortField: string | null;
  sortDirection: SortDirection;
  handleSort: (field: string) => void;
  updateStatut: (factureId: number, newStatut: string, numero: string, created_at: string) => Promise<void>;
  onEditTva: (facture: FactureDetaillee) => void;
  onRemplacer: (facture: FactureDetaillee) => void;
  onAnnulerAvoir: (facture: FactureDetaillee) => void;
}

export const FacturesTable = ({
  currentFactures,
  isLoading,
  filtresActifs,
  sortField,
  sortDirection,
  handleSort,
  updateStatut,
  onEditTva,
  onRemplacer,
  onAnnulerAvoir,
}: FacturesTableProps) => {
  const trie = { currentSortField: sortField, currentSortDirection: sortDirection, onSort: handleSort };
  const actions = { updateStatut, onEditTva, onRemplacer, onAnnulerAvoir };
  const message = filtresActifs ? "Aucune facture ne correspond à ces filtres." : "Aucune facture pour le moment.";
  const vide = !isLoading && currentFactures.length === 0;

  return (
    <>
      {/* Mobile : une carte par facture */}
      <ul className="divide-y divide-gray-100 md:hidden">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <li key={i} className="space-y-3 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </li>
          ))}
        {!isLoading && currentFactures.map((facture) => <FactureCarte key={facture.id} facture={facture} {...actions} />)}
        {vide && (
          <li className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <FileSearch className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">{message}</p>
          </li>
        )}
      </ul>

      {/* Écrans larges : tableau */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
              <EnTeteTriable title="Conseiller" field="conseiller" {...trie} />
              <TableHead className={ENTETE_COLONNE}>N° de facture</TableHead>
              <TableHead className={ENTETE_COLONNE}>Type</TableHead>
              <EnTeteTriable title="Montant" field="montant" align="right" {...trie} />
              <EnTeteTriable title="Mandat" field="numero_mandat" {...trie} />
              <EnTeteTriable title="Signature" field="date_signature" {...trie} />
              <EnTeteTriable title="Envoi" field="statut_envoi" {...trie} />
              <TableHead className={ENTETE_COLONNE}>Paiement</TableHead>
              <EnTeteTriable title="Payée le" field="date_paiement" className="hidden xl:table-cell" {...trie} />
              <TableHead className={cn(ENTETE_COLONNE, "text-right")}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={10} className="px-3 py-4">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              currentFactures.map((facture) => <FactureRow key={facture.id} facture={facture} {...actions} />)}
            {vide && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-14">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <FileSearch className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">{message}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default FacturesTable;
