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
import Popin from "./popin";

export default function TableauFactures({ user }: { user: User }) {
  const [facturesList, setFacturesList] = useState<Facture[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [actionType, setActionType] = useState<"voir" | "envoyer" | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("tous");
  const itemsPerPage = 10;

  // Fonction pour charger les factures
  const loadFactures = () => {
    getFactures(user.id)
      .then((factures) => {
        const facturesTriees = factures
          .map(facture => {
            const factureFormatted = {
              ...facture,
              date_signature: facture.date_signature || new Date().toISOString(),
              numero_mandat: facture.numero_mandat,
              vat_rate: 0,
              created_at: facture.created_at ? new Date(facture.created_at).toISOString() : null
            };
            return factureFormatted as unknown as Facture;
          })
          .sort((a, b) => {
            // Si a.created_at est null et b.created_at n'est pas null, a vient en premier
            if (!a.created_at && b.created_at) {
              return -1;
            }
            // Si b.created_at est null et a.created_at n'est pas null, b vient en premier
            if (a.created_at && !b.created_at) {
              return 1;
            }
            // Si les deux sont null, ordre arbitraire
            if (!a.created_at && !b.created_at) {
              return 0;
            }
            // Si les deux ont une date, trier par ordre décroissant (plus récent en premier)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        setFacturesList(facturesTriees);
      })
      .catch((error) => console.error("Impossible de récupérer les factures :", error));
  };

  // Calcul des totaux des rétrocessions par type
  const totalRetrocessionCommission = facturesList
    ? facturesList
        .filter(facture => facture.type === "commission")
        .reduce((total, facture) => total + parseFloat(facture.retrocession), 0)
    : 0;

  const totalRetrocessionRecrutement = facturesList
    ? facturesList
        .filter(facture => facture.type === "recrutement")
        .reduce((total, facture) => total + parseFloat(facture.retrocession), 0)
    : 0;

  // Filtrer les factures par type
  const filteredFactures = facturesList
    ? typeFilter === "tous"
      ? facturesList
      : facturesList.filter(facture => facture.type === typeFilter)
    : null;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  let currentItems;
  let totalPages;
  if (filteredFactures) {
    currentItems = filteredFactures.slice(indexOfFirstItem, indexOfLastItem);
    totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
  }

  // Réinitialiser la page courante lorsque le filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter]);

  useEffect(() => {
    loadFactures();
  }, [user.id]);

  const sendFacture = async (factureId: number) => {
    try {
      const response = await fetch("/api/factures/send", {
        method: "POST",
        body: JSON.stringify({ factureId }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        alert("Facture envoyée avec succès !");
      } else {
        alert(`Erreur : ${data.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la facture :", error);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <label htmlFor="typeFilter" className="font-medium">Filtrer par type :</label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
          >
            <option value="tous">Tous les types</option>
            <option value="commission">Commission</option>
            <option value="recrutement">Recrutement</option>
          </select>
        </div>
        
        <div className="flex space-x-6">
          <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-2">Total des rétrocessions (Commission)</h3>
            <p className="text-lg font-bold">{totalRetrocessionCommission.toFixed(2)} €</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-2">Total des rétrocessions (Recrutement)</h3>
            <p className="text-lg font-bold">{totalRetrocessionRecrutement.toFixed(2)} €</p>
          </div>
        </div>
      </div>

      <Table>
        <TableCaption>Tableau des dernières factures.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Numéro</TableHead>
            <TableHead className="w-[100px]">Type de facture</TableHead>
            <TableHead>Honoraire Youlive HT</TableHead>
            <TableHead>Rétrocession HT</TableHead>
            <TableHead className="text-center">N° de mandat</TableHead>
            <TableHead className="text-center">Date de signature</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            <TableHead className="text-center">Générer facture</TableHead>
            <TableHead className="text-center">Envoyer facture</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems && currentItems.length > 0 ? (
            currentItems.map((facture, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{facture.numero || "Non défini"}</TableCell>
                <TableCell className="font-medium">{facture.type}</TableCell>
                <TableCell>{parseFloat(facture.honoraires_agent).toFixed(2)} €</TableCell>
                <TableCell>{parseFloat(facture.retrocession).toFixed(2)} €</TableCell>
                <TableCell className="text-center">{facture.numero_mandat || "N/A"}</TableCell>
                <TableCell className="text-center">
                  {facture.date_signature ? new Date(facture.date_signature).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell className="text-center">{facture.statut_paiement}</TableCell>
                <TableCell className="text-center">
                  <button
                    className="px-4 py-2 rounded bg-orange-strong text-white hover:bg-orange-light hover:text-black cursor-pointer"
                    onClick={() => {
                      setSelectedFacture(facture);
                      setActionType("voir");
                    }}
                  >
                    Voir PDF
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    className="px-4 py-2 rounded bg-orange-strong text-white hover:bg-orange-light hover:text-black cursor-pointer"
                    onClick={() => {
                      setSelectedFacture(facture);
                      setActionType("envoyer");
                    }}
                  >
                    Envoyer facture
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                {typeFilter !== "tous" 
                  ? `Aucune facture de type "${typeFilter}" disponible.` 
                  : "Aucune facture disponible."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-center space-x-2 mt-4 items-center">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-4 py-2 bg-gray-200 rounded-sm hover:bg-gray-300 disabled:opacity-50"
        >
          Précédent
        </button>
        <span>
          Page {currentPage} sur {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 bg-gray-200 rounded-sm hover:bg-gray-300 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>

      {selectedFacture && (
        <Popin
          factureId={selectedFacture.id}
          n={selectedFacture.numero}
          date={selectedFacture.created_at}
          a={selectedFacture.apporteur}
          amount={selectedFacture.apporteur_amount}
          actionType={actionType}
          onValidate={() => {
            if (actionType === "envoyer") {
              sendFacture(selectedFacture.id);
            }
            setSelectedFacture(null);
            setActionType(null);
            loadFactures(); // Recharger les factures après validation
          }}
          onClose={() => {
            setSelectedFacture(null);
            setActionType(null);
            loadFactures(); // Recharger les factures après fermeture
          }}
        />
      )}
    </>
  );
}
