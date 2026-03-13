import InputCustom from "@/components/uiCustom/inputCustom";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fef3e8" }}>
          <FileText className="w-3.5 h-3.5" style={{ color: "#E07C24" }} />
        </div>
        <span className="text-sm font-semibold text-gray-700">Contrat & Chiffre d&apos;affaires</span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Type de contrat */}
          <div className="flex flex-col space-y-2">
            <Label className="text-sm text-gray-700">Type de contrat</Label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ "--tw-ring-color": "#E07C24" } as React.CSSProperties}
              value={selectedTypeContrat}
              onChange={(e) => setSelectedTypeContrat(e.target.value)}
              name="type_contrat"
            >
              <option value="">Sélectionner un type</option>
              <option value="Offre Youlive">Offre Youlive</option>
              <option value="Offre Découverte">Offre Découverte</option>
            </select>
          </div>

          {/* Année */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="year_selector_admin" className="text-sm text-gray-700">Année consultée</Label>
            <select
              id="year_selector_admin"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}{year === new Date().getFullYear() ? " (en cours)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            onChange={val => {
              setRetrocession(Number(val));
              setIsRetrocessionManuallySet(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}
