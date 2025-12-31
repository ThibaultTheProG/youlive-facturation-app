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
  selectedYear: number;
  setSelectedYear: (val: number) => void;
  availableYears: number[];
}

export default function ContratManager({
  selectedTypeContrat,
  setSelectedTypeContrat,
  chiffreAffaires,
  setChiffreAffaires,
  retrocession,
  setRetrocession,
  setIsRetrocessionManuallySet,
  selectedYear,
  setSelectedYear,
  availableYears
}: ContratManagerProps) {
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
      <div className="flex flex-col space-y-2">
        <Label htmlFor="year_selector_admin">{"Consulter l'année"}</Label>
        <select
          id="year_selector_admin"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded-md p-2 bg-white"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year} {year === new Date().getFullYear() && "(Année en cours)"}
            </option>
          ))}
        </select>
      </div>
      <InputCustom
        disable={false}
        name="chiffre_affaires"
        label={`Honoraires Youlive HT générés (${selectedYear})`}
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