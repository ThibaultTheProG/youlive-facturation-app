import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { FactureDetaillee } from "@/lib/types";
import { SortDirection, SortField } from "../app/admin/suiviFactures/components/SortableHeader";
import useSWR from 'swr';

// Fonction fetcher pour SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erreur lors de la récupération des données');
  return response.json();
};

export const useFacturesFiltering = () => {
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterType, setFilterType] = useState("");
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // États pour le tri
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Référence pour suivre les changements de filtres
  const prevFiltersRef = useRef({
    searchTerm,
    filterStatut,
    filterType,
    sortField,
    sortDirection
  });

  // Construction de l'URL pour SWR avec les paramètres de filtrage
  const swrKey = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      pageSize: itemsPerPage.toString(),
      searchTerm,
      filterStatut,
      filterType,
      sortField: sortField || 'created_at',
      sortDirection
    });
    return `/api/factures?${params.toString()}`;
  }, [currentPage, itemsPerPage, searchTerm, filterStatut, filterType, sortField, sortDirection]);

  // Utilisation de SWR pour la gestion du cache et des données
  const { data, isLoading, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000 // Cache pendant 1 minute
  });

  // Gestion du tri
  const handleSort = useCallback((field: string) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prev) => prev === 'asc' ? 'desc' : 'asc');
        return prevField;
      }
      setSortDirection('asc');
      return field as SortField;
    });
  }, []);

  // Réinitialiser la page courante lorsque les filtres ou le tri changent
  useEffect(() => {
    // Vérifier si les filtres ont changé
    const filtersChanged = 
      prevFiltersRef.current.searchTerm !== searchTerm ||
      prevFiltersRef.current.filterStatut !== filterStatut ||
      prevFiltersRef.current.filterType !== filterType ||
      prevFiltersRef.current.sortField !== sortField ||
      prevFiltersRef.current.sortDirection !== sortDirection;

    if (filtersChanged) {
      // Réinitialiser la page à 1
      setCurrentPage(1);
      
      // Mettre à jour la référence des filtres précédents
      prevFiltersRef.current = {
        searchTerm,
        filterStatut,
        filterType,
        sortField,
        sortDirection
      };
    }
  }, [searchTerm, filterStatut, filterType, sortField, sortDirection]);

  return {
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
    currentFactures: data?.factures || [],
    totalPages: Math.ceil((data?.totalCount || 0) / itemsPerPage),
    isLoading,
    mutate
  };
};

export default useFacturesFiltering; 