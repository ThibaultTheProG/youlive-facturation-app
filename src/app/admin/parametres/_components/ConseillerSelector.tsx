import React from "react";
import PopoverCustom from "@/components/uiCustom/popoverCustom";
import { Label } from "@/components/ui/label";
import { Conseiller } from "@/lib/types";

interface ConseillerSelectorProps {
  conseillersNoms: { key: number; name: string }[];
  selectedConseiller: Conseiller | null;
  openConseiller: boolean;
  setOpenConseiller: (open: boolean) => void;
  handleSelectConseiller: (val: string) => void;
}

export default function ConseillerSelector({ conseillersNoms, selectedConseiller, openConseiller, setOpenConseiller, handleSelectConseiller }: ConseillerSelectorProps) {
  return (
    <div className="flex flex-col space-y-2">
      <Label>Sélectionner un conseiller</Label>
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
        placeholder="Sélectionner un conseiller..."
        searchPlaceholder="Rechercher un conseiller..."
        emptyMessage="Aucun conseiller trouvé."
        selectedId={selectedConseiller?.id}
      />
    </div>
  );
} 