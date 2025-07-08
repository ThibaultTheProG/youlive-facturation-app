import React, { useCallback, useEffect } from 'react';
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
  filterStatutEnvoi: string;
  setFilterStatutEnvoi: (value: string) => void;
}

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
  // Mémoriser les gestionnaires d'événements
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleStatutChange = useCallback((value: string) => {
    setFilterStatut(value === "tous_statuts" ? "" : value);
  }, [setFilterStatut]);

  const handleTypeChange = useCallback((value: string) => {
    setFilterType(value === "tous_types" ? "" : value);
  }, [setFilterType]);

  const handleStatutEnvoiChange = useCallback((value: string) => {
    setFilterStatutEnvoi(value === "tous_statuts_envoi" ? "" : value);
  }, [setFilterStatutEnvoi]);

  // Effet pour réinitialiser les filtres si nécessaire
  useEffect(() => {
    // Cette fonction vide est intentionnelle, elle sert juste à déclencher l'effet dans le hook parent
    // qui réinitialisera la pagination
  }, [searchTerm, filterStatut, filterType, filterStatutEnvoi]);

  return (
    <div className="grid gap-4 mb-6 md:grid-cols-4">
      {/* Filtre par nom de conseiller */}
      <div className="space-y-2">
        <Label htmlFor="search-conseiller">Rechercher un conseiller</Label>
        <Input
          id="search-conseiller"
          placeholder="Nom du conseiller..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>

      {/* Filtre par statut de paiement */}
      <div className="space-y-2">
        <Label htmlFor="filter-statut">Statut de paiement</Label>
        <Select
          value={filterStatut || "tous_statuts"}
          onValueChange={handleStatutChange}
        >
          <SelectTrigger id="filter-statut" className="w-full">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent className="bg-white">
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
          onValueChange={handleTypeChange}
        >
          <SelectTrigger id="filter-type" className="w-full">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="tous_types">Tous les types</SelectItem>
            <SelectItem value="recrutement">Recrutement</SelectItem>
            <SelectItem value="commission">Commission</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtre par statut d'envoi */}
      <div className="space-y-2">
        <Label htmlFor="filter-statut-envoi">Statut d&apos;envoi</Label>
        <Select
          value={filterStatutEnvoi || "tous_statuts_envoi"}
          onValueChange={handleStatutEnvoiChange}
        >
          <SelectTrigger id="filter-statut-envoi" className="w-full">
            <SelectValue placeholder="Tous les statuts d&apos;envoi" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="tous_statuts_envoi">Tous les statuts d&apos;envoi</SelectItem>
            <SelectItem value="envoyée">Envoyée</SelectItem>
            <SelectItem value="non envoyée">Non envoyée</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default React.memo(FacturesFilters); 