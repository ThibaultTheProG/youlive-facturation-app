import React from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Label } from "@/components/ui/label";

interface ContratManagerProps {
  selectedTypeContrat: string;
  setSelectedTypeContrat: (val: string) => void;
  chiffreAffaires: number;
  setChiffreAffaires: (val: number) => void;
  retrocession: number;
  setRetrocession: (val: number) => void;
  setIsRetrocessionManuallySet: (val: boolean) => void;
}

export default function ContratManager({ selectedTypeContrat, setSelectedTypeContrat, chiffreAffaires, setChiffreAffaires, retrocession, setRetrocession, setIsRetrocessionManuallySet }: ContratManagerProps) {
  return (
    <div className="flex flex-row justify-start space-x-4">
      <div className="flex flex-col space-y-2">
        <Label>Type de contrat</Label>
        <select
          className="border border-gray-300 rounded-md p-2"
          value={selectedTypeContrat}
          onChange={(e) => setSelectedTypeContrat(e.target.value)}
          name="type_contrat"
        >
          <option value="">Sélectionner un type</option>
          <option value="Offre Youlive">Offre Youlive</option>
          <option value="Offre Découverte">Offre Découverte</option>
        </select>
      </div>
      <InputCustom
        disable={false}
        name="chiffre_affaires"
        label="Honoraires Youlive HT générés"
        id="chiffre_affaires"
        type="number"
        value={chiffreAffaires}
        onChange={(val) => setChiffreAffaires(Number(val))}
      />
      <InputCustom
        disable={false}
        name="retrocession"
        label="Pourcentage de rétrocession"
        id="retrocession"
        type="number"
        value={retrocession}
        onChange={val => {
          setRetrocession(Number(val));
          setIsRetrocessionManuallySet(true);
        }}
      />
    </div>
  );
} 