import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FacturesFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatut: string;
  setFilterStatut: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
}

const FacturesFilters: React.FC<FacturesFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatut,
  setFilterStatut,
  filterType,
  setFilterType,
}) => {
  return (
    <div className="grid gap-4 mb-6 md:grid-cols-3">
      {/* Filtre par nom de conseiller */}
      <div className="space-y-2">
        <Label htmlFor="search-conseiller">Rechercher un conseiller</Label>
        <Input
          id="search-conseiller"
          placeholder="Nom du conseiller..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Filtre par statut de paiement */}
      <div className="space-y-2">
        <Label htmlFor="filter-statut">Statut de paiement</Label>
        <Select
          value={filterStatut || "tous_statuts"}
          onValueChange={(value) => setFilterStatut(value === "tous_statuts" ? "" : value)}
        >
          <SelectTrigger id="filter-statut" className="w-full">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent className='bg-white'>
            <SelectItem value="tous_statuts">Tous les statuts</SelectItem>
            <SelectItem value="payé">Payé</SelectItem>
            <SelectItem value="non payé">Non payé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtre par type de facture */}
      <div className="space-y-2">
        <Label htmlFor="filter-type">Type de facture</Label>
        <Select
          value={filterType || "tous_types"}
          onValueChange={(value) => setFilterType(value === "tous_types" ? "" : value)}
        >
          <SelectTrigger id="filter-type" className="w-full">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent className='bg-white'>
            <SelectItem value="tous_types">Tous les types</SelectItem>
            <SelectItem value="recrutement">Recrutement</SelectItem>
            <SelectItem value="commission">Commission</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FacturesFilters; 