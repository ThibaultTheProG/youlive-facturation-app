import InputCustom from "@/components/uiCustom/inputCustom";
import { Label } from "@/components/ui/label";

interface ContratManagerProps {
  selectedTypeContrat: string;
  setSelectedTypeContrat: (val: string) => void;
  chiffreAffaires: number;
  setChiffreAffaires: (val: number) => void;
  retrocession: number;
  /** Saisie manuelle du taux : elle prend le pas sur la valeur calculée. */
  setRetrocession: (val: number) => void;
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
  selectedYear,
  setSelectedYear,
  availableYears
}: ContratManagerProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="type_contrat" className="text-sm text-gray-700">Type de contrat</Label>
          <select
            id="type_contrat"
            className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
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
          <Label htmlFor="year_selector_admin" className="text-sm text-gray-700">Année consultée</Label>
          <select
            id="year_selector_admin"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}{year === new Date().getFullYear() ? " (en cours)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <InputCustom
          disable={false}
          name="chiffre_affaires"
          label={`Honoraires Youlive HT (${selectedYear})`}
          id="chiffre_affaires"
          type="number"
          value={chiffreAffaires}
          onChange={(val) => setChiffreAffaires(Number(val))}
        />
        <InputCustom
          disable={false}
          name="retrocession"
          label="Taux de rétrocession (%)"
          id="retrocession"
          type="number"
          value={retrocession}
          onChange={val => setRetrocession(Number(val))}
        />
      </div>
    </div>
  );
}
