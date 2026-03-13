import React from "react";
import PopoverCustom from "@/components/uiCustom/popoverCustom";
import { Conseiller } from "@/lib/types";
import { Search } from "lucide-react";

interface ConseillerSelectorProps {
  conseillersNoms: { key: number; name: string }[];
  selectedConseiller: Conseiller | null;
  openConseiller: boolean;
  setOpenConseiller: (open: boolean) => void;
  handleSelectConseiller: (val: string) => void;
}

export default function ConseillerSelector({ conseillersNoms, selectedConseiller, openConseiller, setOpenConseiller, handleSelectConseiller }: ConseillerSelectorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">Sélectionner un conseiller</span>
      </div>
      <PopoverCustom
        open={openConseiller}
        onOpenChange={setOpenConseiller}
        options={conseillersNoms}
        value={
          selectedConseiller
            ? `${selectedConseiller.prenom.trim()} ${selectedConseiller.nom.trim()}`
            : ""
        }
        onSelect={handleSelectConseiller}
        placeholder="Rechercher un conseiller..."
        searchPlaceholder="Nom, prénom..."
        emptyMessage="Aucun conseiller trouvé."
        selectedId={selectedConseiller?.id}
      />
      {!selectedConseiller && (
        <p className="text-xs text-gray-400 mt-3">
          Sélectionnez un conseiller pour accéder à ses paramètres
        </p>
      )}
    </div>
  );
}
