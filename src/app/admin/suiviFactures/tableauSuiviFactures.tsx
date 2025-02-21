"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FactureDetaillee } from "@/lib/types";

export default function TableauSuiviFactures() {
  const [factures, setFactures] = useState<FactureDetaillee[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<FactureDetaillee[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  // 🔍 Récupérer la liste des factures depuis l'API
  useEffect(() => {
    async function fetchFactures() {
      try {
        const response = await fetch("/api/factures/get");
        const data = await response.json();
        console.log(data);
        setFactures(data);
        setFilteredFactures(data); // Par défaut, toutes les factures sont affichées
      } catch (error) {
        console.error("Erreur lors de la récupération des factures :", error);
      }
    }

    fetchFactures();
  }, []);

  // 🛠 Filtrer les factures selon le terme recherché et le statut
  useEffect(() => {
    let filtered = factures;

    const normalizeString = (str: string) =>
      str
        .normalize("NFD") // Décompose les caractères accentués
        .replace(/\p{Diacritic}/gu, "") // Supprime les diacritiques (accents)
        .toLowerCase(); // Met en minuscule

    if (searchTerm) {
      const normalizedSearch = normalizeString(searchTerm);

      filtered = filtered.filter((facture) =>
        normalizeString(
          `${facture.conseiller.prenom} ${facture.conseiller.nom}`
        ).includes(normalizedSearch)
      );
    }

    if (filterStatut) {
      filtered = filtered.filter(
        (facture) => facture.statut_paiement === filterStatut
      );
    }

    setFilteredFactures(filtered);
  }, [searchTerm, filterStatut, factures]);

  // 🆙 Mettre à jour le statut d'une facture
  const updateStatut = async (factureId: number, newStatut: string) => {
    try {
      await fetch(`/api/factures/${factureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut_paiement: newStatut }),
      });

      // 🔄 Mettre à jour la liste localement sans recharger la page
      setFactures((prevFactures) =>
        prevFactures.map((facture) =>
          facture.id === factureId
            ? { ...facture, statut_paiement: newStatut }
            : facture
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Suivi des factures</h1>
      {/* 🔍 Filtres */}
      <div className="flex gap-4 mb-4">
        <Input
          type="text"
          placeholder="Rechercher un conseiller..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="en attente">En attente</option>
          <option value="payé">Payé</option>
          <option value="annulé">Annulé</option>
        </select>
      </div>

      {/* 📝 Tableau des factures */}
      <Table>
        <TableCaption>Suivi des paiements des factures</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Conseiller</TableHead>
            <TableHead>N° de facture</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Montant (€)</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFactures.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Aucune facture trouvée.
              </TableCell>
            </TableRow>
          ) : (
            filteredFactures.map((facture) => (
              <TableRow key={facture.id}>
                <TableCell>
                  {facture.conseiller.prenom} {facture.conseiller.nom}
                </TableCell>
                <TableCell>{facture.numero}</TableCell>
                <TableCell>{facture.type}</TableCell>
                <TableCell>{facture.retrocession.toLocaleString()} €</TableCell>
                <TableCell>{facture.statut_paiement}</TableCell>
                <TableCell>
                  {/* 🆙 Bouton pour mettre à jour le statut */}
                  {facture.statut_paiement !== "payé" ? (
                    <Button
                      className="bg-green-500 text-white hover:bg-green-700 cursor-pointer"
                      onClick={() => updateStatut(facture.id, "payé")}
                    >
                      Marquer comme payé
                    </Button>
                  ) : (
                    <Button
                      className="bg-red-500 text-white hover:bg-red-700 cursor-pointer"
                      onClick={() => updateStatut(facture.id, "annulé")}
                    >
                      Annuler
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
