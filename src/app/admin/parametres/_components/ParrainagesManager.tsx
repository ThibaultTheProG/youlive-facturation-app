import React from "react";
import PopoverCustom from "@/components/uiCustom/popoverCustom";
import { Label } from "@/components/ui/label";

interface ParrainagesManagerProps {
  parrains: { key: number; name: string }[];
  openParrain1: boolean;
  setOpenParrain1: (open: boolean) => void;
  selectedParrain: string;
  handleSelectParrain: (val: string) => void;
  selectedParrainId: number | null;
  openParrain2: boolean;
  setOpenParrain2: (open: boolean) => void;
  selectedParrain2: string;
  handleSelectParrain2: (val: string) => void;
  selectedParrain2Id: number | null;
  openParrain3: boolean;
  setOpenParrain3: (open: boolean) => void;
  selectedParrain3: string;
  handleSelectParrain3: (val: string) => void;
  selectedParrain3Id: number | null;
}

export default function ParrainagesManager({ parrains, openParrain1, setOpenParrain1, selectedParrain, handleSelectParrain, selectedParrainId, openParrain2, setOpenParrain2, selectedParrain2, handleSelectParrain2, selectedParrain2Id, openParrain3, setOpenParrain3, selectedParrain3, handleSelectParrain3, selectedParrain3Id }: ParrainagesManagerProps) {
  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-lg font-semibold mb-4">Gestion des parrainages</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="flex flex-col space-y-2">
          <Label>Parrain niveau 1</Label>
          <PopoverCustom
            open={openParrain1}
            onOpenChange={setOpenParrain1}
            options={parrains}
            value={selectedParrain}
            onSelect={handleSelectParrain}
            placeholder="Sélectionner un parrain..."
            searchPlaceholder="Rechercher un parrain..."
            emptyMessage="Aucun parrain trouvé."
            selectedId={selectedParrainId}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Parrain niveau 2</Label>
          <PopoverCustom
            open={openParrain2}
            onOpenChange={setOpenParrain2}
            options={parrains}
            value={selectedParrain2}
            onSelect={handleSelectParrain2}
            placeholder="Sélectionner un parrain..."
            searchPlaceholder="Rechercher un parrain..."
            emptyMessage="Aucun parrain trouvé."
            selectedId={selectedParrain2Id}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Parrain niveau 3</Label>
          <PopoverCustom
            open={openParrain3}
            onOpenChange={setOpenParrain3}
            options={parrains}
            value={selectedParrain3}
            onSelect={handleSelectParrain3}
            placeholder="Sélectionner un parrain..."
            searchPlaceholder="Rechercher un parrain..."
            emptyMessage="Aucun parrain trouvé."
            selectedId={selectedParrain3Id}
          />
        </div>
      </div>
    </div>
  );
} 