"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useFacturesFiltering } from "@/hooks/useFacturesFiltering";
import FacturesFilters from "./components/FacturesFilters";
import { FacturesTable } from "./components/FacturesTable";
import Pagination from "./components/Pagination";
import { Loader2 } from "lucide-react";
import useSWR from 'swr';

// Fonction fetcher pour SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erreur lors de la récupération des données');
  return response.json();
};

// Composant principal
const TableauSuiviFactures: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Construction de l'URL pour SWR
  const swrKey = useMemo(() => `/api/factures?page=${page}&pageSize=${pageSize}`, [page, pageSize]);

  // Utilisation de SWR pour la gestion du cache et des données
  const { data, isLoading, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000 // Cache pendant 1 minute
  });

  // Utilisation du hook personnalisé pour la gestion des filtres et du tri
  const {
    searchTerm,
    setSearchTerm,
    filterStatut,
    setFilterStatut,
    filterType,
    setFilterType,
    sortField,
    sortDirection,
    handleSort,
    currentFactures,
  } = useFacturesFiltering(data?.factures || []);

  // Gestionnaire de changement de page
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Mise à jour du statut d'une facture
  const updateStatut = useCallback(async (
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
  }, [mutate]);

  // Mémorisation des props pour FacturesFilters
  const filtersProps = useMemo(() => ({
    searchTerm,
    setSearchTerm,
    filterStatut,
    setFilterStatut,
    filterType,
    setFilterType
  }), [searchTerm, setSearchTerm, filterStatut, setFilterStatut, filterType, setFilterType]);

  // Mémorisation des props pour FacturesTable
  const tableProps = useMemo(() => ({
    currentFactures,
    sortField,
    sortDirection,
    handleSort,
    updateStatut
  }), [currentFactures, sortField, sortDirection, handleSort, updateStatut]);

  // Mémorisation des props pour Pagination
  const paginationProps = useMemo(() => ({
    currentPage: page,
    totalPages: Math.ceil((data?.totalCount || 0) / pageSize),
    onPageChange: handlePageChange
  }), [page, data?.totalCount, pageSize, handlePageChange]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Suivi des factures</h1>

      {/* Filtres */}
      <FacturesFilters {...filtersProps} />

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
          <FacturesTable {...tableProps} />

          {/* Pagination */}
          <Pagination {...paginationProps} />
        </>
      )}
    </div>
  );
};

export default React.memo(TableauSuiviFactures);
