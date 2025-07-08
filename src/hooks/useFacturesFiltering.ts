import { useState, useEffect, useMemo, useCallback } from "react";
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

  // Construction de l'URL pour SWR avec les paramètres de filtrage
  const swrKey = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      pageSize: itemsPerPage.toString(),
      searchTerm,
      filterStatut,
      filterType,
      sortField: sortField || 'date_signature',
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
    if (sortField === field) {
      // Même champ : inverser la direction
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
    } else {
      // Nouveau champ : réinitialiser à asc
      setSortField(field as SortField);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Réinitialiser la page courante lorsque les filtres ou le tri changent
  useEffect(() => {
    // Réinitialiser la page à 1 quand les filtres ou le tri changent
    setCurrentPage(1);
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