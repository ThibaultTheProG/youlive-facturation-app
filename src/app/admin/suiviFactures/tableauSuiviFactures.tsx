"use client";

import React, { useEffect, useState } from "react";
import { useFacturesFiltering } from "@/hooks/useFacturesFiltering";
import FacturesFilters from "./components/FacturesFilters";
import { FacturesTable } from "./components/FacturesTable";
import Pagination from "./components/Pagination";
import ExportExcelButton from "./components/ExportExcelButton";
import EditTvaDialog from "./components/EditTvaDialog";
import CreateAvoirDialog from "./components/CreateAvoirDialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { FactureDetaillee } from "@/lib/types";
import { toast } from "react-hot-toast";

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

  // État pour la popup d'édition TVA
  const [tvaDialogOpen, setTvaDialogOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState<FactureDetaillee | null>(null);

  // État pour la popup de création d'avoir / ajustement
  const [avoirDialogOpen, setAvoirDialogOpen] = useState(false);

  // Compteurs d'ouverture : servent de `key` aux dialogues pour qu'ils
  // repartent d'un état neuf à chaque ouverture. Incrémentés à l'ouverture
  // seulement, pour ne pas les démonter à la fermeture (ce qui couperait
  // l'animation de sortie).
  const [tvaOpenCount, setTvaOpenCount] = useState(0);
  const [avoirOpenCount, setAvoirOpenCount] = useState(0);

  const handleEditTva = (facture: FactureDetaillee) => {
    setEditingFacture(facture);
    setTvaOpenCount((count) => count + 1);
    setTvaDialogOpen(true);
  };

  const handleCreateAvoir = () => {
    setAvoirOpenCount((count) => count + 1);
    setAvoirDialogOpen(true);
  };

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
      toast.error(
        `Erreur lors de la mise à jour : ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  return (
    <div>
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

      {/* Actions */}
      <div className="flex justify-end gap-2 mb-4">
        <Button
          onClick={handleCreateAvoir}
          className="bg-orange-strong text-white hover:bg-orange-light hover:text-black cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1" />
          Créer un avoir / ajustement
        </Button>
        <ExportExcelButton />
      </div>

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
            onEditTva={handleEditTva}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* `key` liée au compteur d'ouvertures : réinitialise l'état local du
          dialogue à chaque ouverture, sans effet de resynchronisation. */}
      <EditTvaDialog
        key={`tva-${tvaOpenCount}`}
        facture={editingFacture}
        open={tvaDialogOpen}
        onOpenChange={setTvaDialogOpen}
        onSaved={async () => {
          await mutate();
        }}
      />

      <CreateAvoirDialog
        key={`avoir-${avoirOpenCount}`}
        open={avoirDialogOpen}
        onOpenChange={setAvoirDialogOpen}
        onCreated={async () => {
          await mutate();
        }}
      />
    </div>
  );
};

export default TableauSuiviFactures;
