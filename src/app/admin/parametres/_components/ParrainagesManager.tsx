import React from "react";
import PopoverCustom from "@/components/uiCustom/popoverCustom";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

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

const niveauConfig = [
  { label: "Niveau 1", percent: "6–8%", description: "Parrain direct" },
  { label: "Niveau 2", percent: "2%", description: "Parrain du parrain" },
  { label: "Niveau 3", percent: "1%", description: "3ème niveau" },
];

export default function ParrainagesManager({ parrains, openParrain1, setOpenParrain1, selectedParrain, handleSelectParrain, selectedParrainId, openParrain2, setOpenParrain2, selectedParrain2, handleSelectParrain2, selectedParrain2Id, openParrain3, setOpenParrain3, selectedParrain3, handleSelectParrain3, selectedParrain3Id }: ParrainagesManagerProps) {
  const niveaux = [
    { open: openParrain1, setOpen: setOpenParrain1, value: selectedParrain, onSelect: handleSelectParrain, id: selectedParrainId },
    { open: openParrain2, setOpen: setOpenParrain2, value: selectedParrain2, onSelect: handleSelectParrain2, id: selectedParrain2Id },
    { open: openParrain3, setOpen: setOpenParrain3, value: selectedParrain3, onSelect: handleSelectParrain3, id: selectedParrain3Id },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fef3e8" }}>
          <Users className="w-3.5 h-3.5" style={{ color: "#E07C24" }} />
        </div>
        <span className="text-sm font-semibold text-gray-700">Chaîne de parrainage</span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-6">
          {niveaux.map((niveau, i) => (
            <div key={i} className="relative flex flex-col gap-2">
              {/* Connector line between levels */}
              {i < 2 && (
                <div className="absolute top-5 left-full w-6 border-t border-dashed border-gray-200 z-10" style={{ transform: "translateY(-50%)" }} />
              )}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#fef3e8", color: "#E07C24" }}
                >
                  {niveauConfig[i].label}
                </span>
                <span className="text-xs text-gray-400">{niveauConfig[i].percent}</span>
              </div>
              <Label className="text-xs text-gray-500">{niveauConfig[i].description}</Label>
              <PopoverCustom
                open={niveau.open}
                onOpenChange={niveau.setOpen}
                options={parrains}
                value={niveau.value}
                onSelect={niveau.onSelect}
                placeholder="Sélectionner..."
                searchPlaceholder="Rechercher..."
                emptyMessage="Aucun parrain trouvé."
                selectedId={niveau.id}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
