import { useState, useMemo, useCallback } from "react";
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
  const [searchTerm, setSearchTermState] = useState("");
  const [filterStatut, setFilterStatutState] = useState("");
  const [filterType, setFilterTypeState] = useState("");
  const [filterStatutEnvoi, setFilterStatutEnvoiState] = useState("");

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
      filterStatutEnvoi,
      sortField: sortField || 'date_signature',
      sortDirection
    });
    
    return `/api/factures?${params.toString()}`;
  }, [currentPage, itemsPerPage, searchTerm, filterStatut, filterType, filterStatutEnvoi, sortField, sortDirection]);

  // Utilisation de SWR pour la gestion du cache et des données
  const { data, isLoading, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000 // Cache pendant 1 minute
  });

  // Tout changement de filtre ou de tri ramène à la première page. C'est fait
  // dans les setters plutôt que dans un effet : la page est remise à 1 dans le
  // même rendu, ce qui évite une requête intermédiaire sur l'ancienne page.
  const setSearchTerm = useCallback((value: string) => {
    setSearchTermState(value);
    setCurrentPage(1);
  }, []);

  const setFilterStatut = useCallback((value: string) => {
    setFilterStatutState(value);
    setCurrentPage(1);
  }, []);

  const setFilterType = useCallback((value: string) => {
    setFilterTypeState(value);
    setCurrentPage(1);
  }, []);

  const setFilterStatutEnvoi = useCallback((value: string) => {
    setFilterStatutEnvoiState(value);
    setCurrentPage(1);
  }, []);

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
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  return {
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
    currentFactures: data?.factures || [],
    totalPages: Math.ceil((data?.totalCount || 0) / itemsPerPage),
    isLoading,
    mutate
  };
};

export default useFacturesFiltering; 