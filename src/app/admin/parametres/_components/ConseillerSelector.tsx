import React from "react";
import PopoverCustom from "@/components/uiCustom/popoverCustom";
import { Conseiller } from "@/lib/types";
import { Search } from "lucide-react";
import { initiales } from "@/utils/initiales";

interface ConseillerSelectorProps {
  conseillersNoms: { key: number; name: string }[];
  selectedConseiller: Conseiller | null;
  openConseiller: boolean;
  setOpenConseiller: (open: boolean) => void;
  handleSelectConseiller: (val: string) => void;
}

export default function ConseillerSelector({ conseillersNoms, selectedConseiller, openConseiller, setOpenConseiller, handleSelectConseiller }: ConseillerSelectorProps) {
  const nomComplet = selectedConseiller
    ? `${selectedConseiller.prenom.trim()} ${selectedConseiller.nom.trim()}`
    : "";
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="w-full min-w-[16rem] sm:w-auto sm:flex-1 sm:max-w-md">
        <div className="mb-2 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Conseiller</span>
        </div>
        <PopoverCustom
          open={openConseiller}
          onOpenChange={setOpenConseiller}
          options={conseillersNoms}
          value={nomComplet}
          onSelect={handleSelectConseiller}
          placeholder="Rechercher un conseiller..."
          searchPlaceholder="Nom, prénom..."
          emptyMessage="Aucun conseiller trouvé."
          selectedId={selectedConseiller?.id}
        />
      </div>

      {selectedConseiller ? (
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fef3e8] text-sm font-semibold text-[#b35a10]"
          >
            {initiales(nomComplet)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{nomComplet}</p>
            <p className="truncate text-xs text-gray-500">
              ID #{selectedConseiller.id}
              {selectedConseiller.email ? ` · ${selectedConseiller.email}` : ""}
            </p>
          </div>
        </div>
      ) : (
        <p className="pb-2 text-sm text-gray-400">Sélectionnez un conseiller pour accéder à ses paramètres.</p>
      )}
    </div>
  );
}
