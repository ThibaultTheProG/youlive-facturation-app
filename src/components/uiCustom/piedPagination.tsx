import { ChevronLeft, ChevronRight } from "lucide-react";

const BOUTON =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60 disabled:cursor-not-allowed disabled:opacity-40";

type Props = {
  /** Premier et dernier éléments affichés (1-indexés), et total filtré. */
  debut: number;
  fin: number;
  total: number;
  /** Nom de l'élément, au singulier : « facture », « filleul »… */
  element: string;
  page: number;
  totalPages: number;
  onPrecedent: () => void;
  onSuivant: () => void;
};

export function PiedPagination({ debut, fin, total, element, page, totalPages, onPrecedent, onSuivant }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 md:px-5">
      <p className="text-sm text-gray-500" aria-live="polite">
        {total === 0 ? `0 ${element}` : `${debut}–${fin} sur ${total} ${element}${total > 1 ? "s" : ""}`}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          Page {page} sur {totalPages}
        </span>
        <button type="button" aria-label="Page précédente" disabled={page === 1} onClick={onPrecedent} className={BOUTON}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Page suivante" disabled={page === totalPages} onClick={onSuivant} className={BOUTON}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
