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
  
  console.log(user.id, facturesList);

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
          {facturesList && facturesList.length > 0 ? (
            facturesList.map((facture) => (
              <TableRow key={facture.id}>
                <TableCell className="font-medium">{facture.type}</TableCell>
                <TableCell>{facture.honoraire.toFixed(2)} €</TableCell>
                <TableCell>{facture.retrocession_amount.toFixed(2)} €</TableCell>
                <TableCell className="text-right">{facture.numero_mandat || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  {facture.date_signature
                    ? new Date(facture.date_signature).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-right">{facture.statut_dispo}</TableCell>
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
    </>
  );
}
