import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Classes d'un en-tête de colonne non triable, pour qu'il s'aligne avec les triables. */
export const ENTETE_COLONNE = "px-3 text-xs font-semibold uppercase tracking-wide text-gray-500";

type Props = {
  title: string;
  field: string;
  currentSortField: string | null;
  currentSortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  align?: "left" | "right";
  className?: string;
};

/** En-tête de colonne triable : un vrai bouton, avec `aria-sort` sur la cellule. */
export function EnTeteTriable({
  title,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  align = "left",
  className,
}: Props) {
  const actif = currentSortField === field;
  return (
    <TableHead
      aria-sort={actif ? (currentSortDirection === "asc" ? "ascending" : "descending") : "none"}
      className={cn("px-3", align === "right" && "text-right", className)}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "-mx-2 inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide outline-none transition-colors",
          "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60",
          actif ? "text-gray-900" : "text-gray-500"
        )}
      >
        {title}
        {actif ? (
          currentSortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />
        )}
      </button>
    </TableHead>
  );
}
