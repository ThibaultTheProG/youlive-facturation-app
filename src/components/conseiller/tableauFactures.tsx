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

  return (
    <>
      <Table>
        <TableCaption>Tableau des dernières factures.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type de facture</TableHead>
            <TableHead>Honoraire Youlive HT</TableHead>
            <TableHead>Rétrocession HT</TableHead>
            <TableHead className="text-right">N° de mandat</TableHead>
            <TableHead className="text-right">Date de signature</TableHead>
            <TableHead className="text-right">Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems && currentItems.length > 0 ? (
            currentItems.map((facture, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{facture.type}</TableCell>
                <TableCell>{facture.honoraires_agent} €</TableCell>
                <TableCell>{facture.retrocession} €</TableCell>
                <TableCell className="text-right">
                  {facture.numero_mandat || "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  {facture.date_signature
                    ? new Date(facture.date_signature).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  {facture.statut_dispo}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Aucune facture disponible.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-end space-x-2 mt-4">
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
