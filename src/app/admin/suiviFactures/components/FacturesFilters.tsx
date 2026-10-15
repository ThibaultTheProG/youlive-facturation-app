import React from "react";
import { Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FacturesFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatut: string;
  setFilterStatut: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  filterStatutEnvoi: string;
  setFilterStatutEnvoi: (value: string) => void;
}

const DECLENCHEUR = "w-full min-w-[10.5rem] cursor-pointer";

const FacturesFilters: React.FC<FacturesFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatut,
  setFilterStatut,
  filterType,
  setFilterType,
  filterStatutEnvoi,
  setFilterStatutEnvoi,
}) => {
  const filtresActifs = Boolean(searchTerm || filterStatut || filterType || filterStatutEnvoi);

  const reinitialiser = () => {
    setSearchTerm("");
    setFilterStatut("");
    setFilterType("");
    setFilterStatutEnvoi("");
  };

  return (
    <>
      <div className="min-w-[14rem] flex-1 md:max-w-sm">
        <Label htmlFor="search-conseiller" className="mb-1 block text-xs font-medium text-gray-500">
          Conseiller ou n° de mandat
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="search-conseiller"
            type="search"
            placeholder="Nom ou n° de mandat…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="filter-statut" className="mb-1 block text-xs font-medium text-gray-500">
          Paiement
        </Label>
        <Select value={filterStatut || "tous_statuts"} onValueChange={(v) => setFilterStatut(v === "tous_statuts" ? "" : v)}>
          <SelectTrigger id="filter-statut" className={DECLENCHEUR}>
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous_statuts">Tous les statuts</SelectItem>
            <SelectItem value="payé">Payé</SelectItem>
            <SelectItem value="non payé">Non payé</SelectItem>
            <SelectItem value="annulée">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="filter-type" className="mb-1 block text-xs font-medium text-gray-500">
          Type
        </Label>
        <Select value={filterType || "tous_types"} onValueChange={(v) => setFilterType(v === "tous_types" ? "" : v)}>
          <SelectTrigger id="filter-type" className={DECLENCHEUR}>
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous_types">Tous les types</SelectItem>
            <SelectItem value="recrutement">Recrutement</SelectItem>
            <SelectItem value="commission">Commission</SelectItem>
            <SelectItem value="avoir">Avoir / Ajustement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="filter-statut-envoi" className="mb-1 block text-xs font-medium text-gray-500">
          Envoi
        </Label>
        <Select
          value={filterStatutEnvoi || "tous_statuts_envoi"}
          onValueChange={(v) => setFilterStatutEnvoi(v === "tous_statuts_envoi" ? "" : v)}
        >
          <SelectTrigger id="filter-statut-envoi" className={DECLENCHEUR}>
            <SelectValue placeholder="Tous les envois" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous_statuts_envoi">Tous les envois</SelectItem>
            <SelectItem value="envoyée">Envoyée</SelectItem>
            <SelectItem value="non envoyée">Non envoyée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtresActifs && (
        <button
          type="button"
          onClick={reinitialiser}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
        >
          <X className="h-4 w-4" />
          Réinitialiser
        </button>
      )}
    </>
  );
};

export default React.memo(FacturesFilters);
