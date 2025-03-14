import { useState, useEffect, useMemo } from "react";
import { FactureDetaillee } from "@/lib/types";
import { SortDirection, SortField } from "../components/SortableHeader";

export const useFacturesFiltering = (factures: FactureDetaillee[]) => {
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

  // Filtrage et tri des factures
  const [filteredFactures, setFilteredFactures] = useState<FactureDetaillee[]>([]);

  // Fonction pour normaliser les chaînes (pour la recherche insensible aux accents)
  const normalizeString = (str: string = "") => 
    str
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

  // Filtrage et tri des factures
  useEffect(() => {
    if (!Array.isArray(factures)) {
      setFilteredFactures([]);
      return;
    }
    
    let filtered = [...factures];

    // Filtre par nom de conseiller
    if (searchTerm) {
      const normalizedSearch = normalizeString(searchTerm);
      filtered = filtered.filter((facture) => {
        if (!facture.conseiller || !facture.conseiller.prenom || !facture.conseiller.nom) {
          return false;
        }
        
        return normalizeString(
          `${facture.conseiller.prenom} ${facture.conseiller.nom}`
        ).includes(normalizedSearch);
      });
    }

    // Filtre par statut
    if (filterStatut) {
      filtered = filtered.filter(
        (facture) => facture.statut_paiement === filterStatut
      );
    }

    // Filtre par type
    if (filterType) {
      filtered = filtered.filter(
        (facture) => facture.type === filterType
      );
    }

    // Tri des résultats
    if (sortField) {
      filtered.sort((a, b) => {
        let valueA, valueB;
        
        if (sortField === 'conseiller') {
          valueA = `${a.conseiller?.prenom || ''} ${a.conseiller?.nom || ''}`.toLowerCase();
          valueB = `${b.conseiller?.prenom || ''} ${b.conseiller?.nom || ''}`.toLowerCase();
        } else if (sortField === 'montant') {
          valueA = parseFloat(a.retrocession);
          valueB = parseFloat(b.retrocession);
        } else {
          return 0;
        }
        
        if (valueA < valueB) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredFactures(filtered);
  }, [searchTerm, filterStatut, filterType, factures, sortField, sortDirection]);

  // Gestion du tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as SortField);
      setSortDirection('asc');
    }
  };

  // Calcul des factures à afficher pour la page courante
  const currentFactures = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return Array.isArray(filteredFactures) 
      ? filteredFactures.slice(indexOfFirstItem, indexOfLastItem) 
      : [];
  }, [filteredFactures, currentPage, itemsPerPage]);

  // Calcul du nombre total de pages
  const totalPages = useMemo(() => 
    Array.isArray(filteredFactures) 
      ? Math.ceil(filteredFactures.length / itemsPerPage) 
      : 0,
    [filteredFactures, itemsPerPage]
  );

  // Réinitialiser la page courante lorsque les filtres ou le tri changent
  useEffect(() => {
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
    currentFactures,
    totalPages,
    filteredFactures
  };
};

export default useFacturesFiltering; 