"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { User, Facture } from "@/lib/types";
import { getFactures } from "@/backend/gestionFactures";

export default function TableauFactures({ user }: { user: User }) {
  const [facturesList, setFacturesList] = useState<Facture[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState<number | null>(null); // ID du bouton en cours de chargement
  const itemsPerPage = 10;

  // Calcul des données paginées
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  let currentItems;
  let totalPages;
  if (facturesList) {
    currentItems = facturesList.slice(indexOfFirstItem, indexOfLastItem);
    totalPages = Math.ceil(facturesList.length / itemsPerPage);
  }

  useEffect(() => {
    getFactures(user.id)
      .then((factures) => setFacturesList(factures))
      .catch((error) => {
        console.error("Impossible de récupérer les factures :", error);
      });
  }, [user.id]);

  const handleCreateFacture = async (factureId: number) => {
    setLoadingId(factureId); // Indique le bouton en cours de chargement

    try {
      const response = await fetch(`/api/factures/createPdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: factureId }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la facture.");
      }

      const data = await response.json();
      const factureUrl = data.url;

      // Ouvrir la facture dans un nouvel onglet
      window.open(factureUrl, "_blank");
    } catch (error) {
      console.error("Erreur lors de la création de la facture :", error);
    } finally {
      setLoadingId(null); // Réinitialise l'état de chargement
    }
  };

  return (
    <>
      <Table>
        <TableCaption>Tableau des dernières factures.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID BDD</TableHead>
            <TableHead className="w-[100px]">Type de facture</TableHead>
            <TableHead>Honoraire Youlive HT</TableHead>
            <TableHead>Rétrocession HT</TableHead>
            <TableHead className="text-center">N° de mandat</TableHead>
            <TableHead className="text-center">Date de signature</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems && currentItems.length > 0 ? (
            currentItems.map((facture, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{facture.id}</TableCell>
                <TableCell className="font-medium">{facture.type}</TableCell>
                <TableCell>{facture.honoraires_agent} €</TableCell>
                <TableCell>{facture.retrocession} €</TableCell>
                <TableCell className="text-center">
                  {facture.numero_mandat || "N/A"}
                </TableCell>
                <TableCell className="text-center">
                  {facture.date_signature
                    ? new Date(facture.date_signature).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell className="text-center">
                  {facture.statut_dispo}
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => handleCreateFacture(facture.id)}
                    disabled={loadingId === facture.id}
                    className={`px-4 py-2 rounded ${
                      loadingId === facture.id
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-orangeStrong text-white hover:bg-orangeLight hover:text-black"
                    }`}
                  >
                    {loadingId === facture.id ? "Création..." : "Créer Facture"}
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Aucune facture disponible.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-center space-x-2 mt-4 items-center">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Précédent
        </button>
        <span>
          Page {currentPage} sur {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </>
  );
}
