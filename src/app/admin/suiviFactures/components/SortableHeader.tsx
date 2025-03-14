import React from 'react';
import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// Types pour le tri
export type SortDirection = 'asc' | 'desc';
export type SortField = 'conseiller' | 'montant' | null;

// Composant pour l'en-tête de colonne triable
interface SortableHeaderProps {
  title: string;
  field: string;
  currentSortField: string | null;
  currentSortDirection: SortDirection;
  onSort: (field: string) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  title, 
  field, 
  currentSortField, 
  currentSortDirection, 
  onSort 
}) => (
  <TableHead 
    className="cursor-pointer hover:bg-gray-100 transition-colors" 
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {title}
      {currentSortField === field ? (
        currentSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 text-gray-400" />
      )}
    </div>
  </TableHead>
);

export default SortableHeader; 