"use client";

import React, { useEffect, useState } from "react";
import { useFacturesFiltering } from "@/hooks/useFacturesFiltering";
import FacturesFilters from "./components/FacturesFilters";
import { FacturesTable } from "./components/FacturesTable";
import { PiedPagination } from "@/components/uiCustom/piedPagination";
import ExportExcelButton from "./components/ExportExcelButton";
import EditTvaDialog from "./components/EditTvaDialog";
import CreateAvoirDialog from "./components/CreateAvoirDialog";
import RemplacerFactureDialog from "./components/RemplacerFactureDialog";
import AnnulerAvoirDialog from "./components/AnnulerAvoirDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    totalCount,
    itemsPerPage,
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

  // État pour la popup « Annuler et remplacer »
  const [remplacerDialogOpen, setRemplacerDialogOpen] = useState(false);
  const [remplacantFacture, setRemplacantFacture] = useState<FactureDetaillee | null>(null);
  const [remplacerOpenCount, setRemplacerOpenCount] = useState(0);

  const handleRemplacer = (facture: FactureDetaillee) => {
    setRemplacantFacture(facture);
    setRemplacerOpenCount((count) => count + 1);
    setRemplacerDialogOpen(true);
  };

  // État pour la popup d'annulation d'un avoir / ajustement non envoyé
  const [annulerDialogOpen, setAnnulerDialogOpen] = useState(false);
  const [avoirAAnnuler, setAvoirAAnnuler] = useState<FactureDetaillee | null>(null);
  const [annulerOpenCount, setAnnulerOpenCount] = useState(0);

  const handleAnnulerAvoir = (facture: FactureDetaillee) => {
    setAvoirAAnnuler(facture);
    setAnnulerOpenCount((count) => count + 1);
    setAnnulerDialogOpen(true);
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

  const filtresActifs = Boolean(searchTerm || filterStatut || filterType || filterStatutEnvoi);
  const debut = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const fin = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div>
      <div className="overflow-clip rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4 border-b border-gray-100 p-4 md:p-5">
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

          <div className="flex w-full flex-wrap items-center gap-2 lg:ml-auto lg:w-auto">
            <ExportExcelButton />
            <Button onClick={handleCreateAvoir} className="cursor-pointer bg-[#E07C24] text-white hover:bg-[#c96a17]">
              <Plus className="mr-1 h-4 w-4" />
              Créer un avoir / ajustement
            </Button>
          </div>
        </div>

        <FacturesTable
          currentFactures={currentFactures}
          isLoading={isLoading}
          filtresActifs={filtresActifs}
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
          updateStatut={updateStatut}
          onEditTva={handleEditTva}
          onRemplacer={handleRemplacer}
          onAnnulerAvoir={handleAnnulerAvoir}
        />

        <PiedPagination
          debut={debut}
          fin={fin}
          total={totalCount}
          element="facture"
          page={currentPage}
          totalPages={Math.max(1, totalPages)}
          onPrecedent={() => setCurrentPage(currentPage - 1)}
          onSuivant={() => setCurrentPage(currentPage + 1)}
        />
      </div>

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

      <RemplacerFactureDialog
        key={`remplacer-${remplacerOpenCount}`}
        facture={remplacantFacture}
        open={remplacerDialogOpen}
        onOpenChange={setRemplacerDialogOpen}
        onReplaced={async () => {
          await mutate();
          toast.success("Facture annulée et remplacée");
        }}
      />

      <AnnulerAvoirDialog
        key={`annuler-${annulerOpenCount}`}
        facture={avoirAAnnuler}
        open={annulerDialogOpen}
        onOpenChange={setAnnulerDialogOpen}
        onCancelled={async () => {
          await mutate();
          toast.success("Document annulé");
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
