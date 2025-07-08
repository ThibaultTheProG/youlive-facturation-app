"use client";

import React, { useEffect } from "react";
import { useFacturesFiltering } from "@/hooks/useFacturesFiltering";
import FacturesFilters from "./components/FacturesFilters";
import { FacturesTable } from "./components/FacturesTable";
import Pagination from "./components/Pagination";
import { Loader2 } from "lucide-react";

// Composant principal
const TableauSuiviFactures: React.FC = () => {
  // Utilisation du hook personnalisé pour la gestion des filtres et du tri
  const {
    searchTerm,
    setSearchTerm,
    filterStatut,
    setFilterStatut,
    filterType,
    setFilterType,
    filterStatutEnvoi,
    setFilterStatutEnvoi,
    currentPage,
    setCurrentPage,
    sortField,
    sortDirection,
    handleSort,
    currentFactures,
    totalPages,
    isLoading,
    mutate
  } = useFacturesFiltering();

  // Effet pour s'assurer que la pagination est correctement gérée
  useEffect(() => {
    // Si le nombre total de pages est inférieur à la page courante,
    // réinitialiser la page courante à 1
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, setCurrentPage]);

  // Mise à jour du statut d'une facture
  const updateStatut = async (
    factureId: number,
    newStatut: string,
    numero: string,
    created_at: string
  ) => {
    try {
      const response = await fetch(`/api/factures/${factureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut_paiement: newStatut,
          numero,
          created_at,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      // Mise à jour optimiste avec SWR
      await mutate();

      console.log(`Statut de la facture mis à jour avec succès: ${newStatut}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert(
        `Erreur lors de la mise à jour : ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Suivi des factures</h1>

      {/* Filtres */}
      <FacturesFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatut={filterStatut}
        setFilterStatut={setFilterStatut}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatutEnvoi={filterStatutEnvoi}
        setFilterStatutEnvoi={setFilterStatutEnvoi}
      />

      {/* État de chargement */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg text-gray-600">
            Chargement des factures en cours...
          </p>
        </div>
      ) : (
        <>
          {/* Tableau des factures */}
          <FacturesTable
            currentFactures={currentFactures}
            sortField={sortField}
            sortDirection={sortDirection}
            handleSort={handleSort}
            updateStatut={updateStatut}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default TableauSuiviFactures;
