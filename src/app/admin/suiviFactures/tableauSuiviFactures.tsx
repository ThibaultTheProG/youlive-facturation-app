"use client";

import { useState, useEffect } from "react";
import { FactureDetaillee } from "@/lib/types";
import { useFacturesFiltering } from "./hooks/useFacturesFiltering";
import FacturesFilters from "./components/FacturesFilters";
import { FacturesTable } from "./components/FacturesTable";
import Pagination from "./components/Pagination";

// Composant principal
export default function TableauSuiviFactures() {
  // États pour les données
  const [factures, setFactures] = useState<FactureDetaillee[]>([]);
  
  // Récupération des données
  useEffect(() => {
    async function fetchFactures() {
      try {
        const response = await fetch("/api/factures");
        const data = await response.json();
        console.log("Données reçues de l'API:", data);
        
        // S'assurer que data est un tableau
        const facturesArray = Array.isArray(data) ? data : [];
        setFactures(facturesArray);
      } catch (error) {
        console.error("Erreur lors de la récupération des factures :", error);
        setFactures([]);
      }
    }

    fetchFactures();
  }, []);

  // Utilisation du hook personnalisé pour la gestion des filtres et du tri
  const {
    searchTerm,
    setSearchTerm,
    filterStatut,
    setFilterStatut,
    filterType,
    setFilterType,
    currentPage,
    setCurrentPage,
    sortField,
    sortDirection,
    handleSort,
    currentFactures,
    totalPages,
  } = useFacturesFiltering(factures);

  // Mise à jour du statut d'une facture
  const updateStatut = async (factureId: number, newStatut: string, numero: string, created_at: string) => {
    try {
      const response = await fetch(`/api/factures/${factureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut_paiement: newStatut, numero, created_at }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      // Mise à jour locale des factures
      setFactures(prevFactures => {
        if (!Array.isArray(prevFactures)) return [];
        
        return prevFactures.map((facture) =>
          facture.id === factureId
            ? { ...facture, statut_paiement: newStatut }
            : facture
        );
      });
      
      console.log(`Statut de la facture mis à jour avec succès: ${newStatut}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert(`Erreur lors de la mise à jour : ${error instanceof Error ? error.message : String(error)}`);
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
      />

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
    </div>
  );
}
