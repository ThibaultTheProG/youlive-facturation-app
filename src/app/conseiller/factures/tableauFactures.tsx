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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function TableauFactures({ user }: { user: User }) {
  const [facturesList, setFacturesList] = useState<Facture[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [actionType, setActionType] = useState<"voir" | "envoyer" | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("tous");
  const [dateFilter, setDateFilter] = useState<string>("tous");
  
  // États pour le tri
  const [sortField, setSortField] = useState<string | null>("date_signature");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const itemsPerPage = 10;

  // Composant pour l'en-tête de colonne triable
  const SortableHeader = ({ 
    title, 
    field, 
    currentSortField, 
    currentSortDirection, 
    onSort 
  }: {
    title: string;
    field: string;
    currentSortField: string | null;
    currentSortDirection: "asc" | "desc";
    onSort: (field: string) => void;
  }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-100 transition-colors text-center" 
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1 justify-center">
        {title}
        {currentSortField === field ? (
          currentSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </TableHead>
  );

  // Fonction pour gérer le tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Même champ : inverser la direction
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
    } else {
      // Nouveau champ : réinitialiser à asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
              created_at: facture.created_at ? new Date(facture.created_at).toISOString() : null,
              added_at: facture.added_at ? new Date(facture.added_at).toISOString() : null
            };
            return factureFormatted as unknown as Facture;
          })
          .sort((a, b) => {
            // Trier selon le champ et la direction sélectionnés
            let comparison = 0;
            
            if (sortField === 'date_signature') {
              const dateA = a.date_signature ? new Date(a.date_signature).getTime() : 0;
              const dateB = b.date_signature ? new Date(b.date_signature).getTime() : 0;
              comparison = dateA - dateB;
            } else if (sortField === 'montant') {
              const montantA = parseFloat(a.retrocession) || 0;
              const montantB = parseFloat(b.retrocession) || 0;
              comparison = montantA - montantB;
            } else if (sortField === 'numero') {
              const numeroA = a.numero || '';
              const numeroB = b.numero || '';
              comparison = numeroA.localeCompare(numeroB);
            } else if (sortField === 'type') {
              const typeA = a.type || '';
              const typeB = b.type || '';
              comparison = typeA.localeCompare(typeB);
            }
            
            // Appliquer la direction de tri
            return sortDirection === 'asc' ? comparison : -comparison;
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

  // Filtrer les factures par type et par date
  const filteredFactures = facturesList
    ? facturesList.filter(facture => {
        // Filtre par type
        if (typeFilter !== "tous" && facture.type !== typeFilter) {
          return false;
        }
        
        // Filtre par date de signature
        if (dateFilter !== "tous") {
          const factureDate = facture.date_signature ? new Date(facture.date_signature) : null;
          if (!factureDate) return false;
          
          const today = new Date();
          
          switch (dateFilter) {
            case "aujourd_hui":
              return factureDate.toDateString() === today.toDateString();
            case "cette_semaine":
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              return factureDate >= weekAgo;
            case "ce_mois":
              return factureDate.getMonth() === today.getMonth() && 
                     factureDate.getFullYear() === today.getFullYear();
            case "ce_trimestre":
              const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
              return factureDate >= quarterStart;
            case "cette_annee":
              return factureDate.getFullYear() === today.getFullYear();
            default:
              return true;
          }
        }
        
        return true;
      })
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
  }, [typeFilter, dateFilter]);

  // Recharger les factures quand le tri change
  useEffect(() => {
    if (facturesList) {
      loadFactures();
    }
  }, [sortField, sortDirection]);

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
          
          <label htmlFor="dateFilter" className="font-medium ml-4">Filtrer par date de signature :</label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
          >
            <option value="tous">Toutes les dates</option>
            <option value="aujourd_hui">Aujourd&apos;hui</option>
            <option value="cette_semaine">Cette semaine</option>
            <option value="ce_mois">Ce mois</option>
            <option value="ce_trimestre">Ce trimestre</option>
            <option value="cette_annee">Cette année</option>
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
            <SortableHeader 
              title="Numéro" 
              field="numero" 
              currentSortField={sortField} 
              currentSortDirection={sortDirection} 
              onSort={handleSort} 
            />
            <SortableHeader 
              title="Type de facture" 
              field="type" 
              currentSortField={sortField} 
              currentSortDirection={sortDirection} 
              onSort={handleSort} 
            />
            <TableHead>Honoraire Youlive HT</TableHead>
            <SortableHeader 
              title="Rétrocession HT" 
              field="montant" 
              currentSortField={sortField} 
              currentSortDirection={sortDirection} 
              onSort={handleSort} 
            />
            <TableHead className="text-center">N° de mandat</TableHead>
            <SortableHeader 
              title="Date de signature" 
              field="date_signature" 
              currentSortField={sortField} 
              currentSortDirection={sortDirection} 
              onSort={handleSort} 
            />
            <TableHead className="text-center">Date d&apos;ajout</TableHead>
            <TableHead className="text-center">Statut de paiement</TableHead>
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
                <TableCell className="text-center">
                  {facture.added_at ? new Date(facture.added_at).toLocaleDateString() : "Non disponible"}
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
                    className={`px-4 py-2 rounded cursor-pointer ${
                      facture.statut_paiement === "payé"
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : facture.statut_envoi === "envoyée"
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-orange-strong text-white hover:bg-orange-light hover:text-black"
                    }`}
                    onClick={() => {
                      if (facture.statut_paiement !== "payé" && facture.statut_envoi !== "envoyée") {
                        setSelectedFacture(facture);
                        setActionType("envoyer");
                      }
                    }}
                    disabled={facture.statut_paiement === "payé" || facture.statut_envoi === "envoyée"}
                  >
                    {facture.statut_paiement === "payé" 
                      ? "Facture payée" 
                      : facture.statut_envoi === "envoyée" 
                      ? "Facture envoyée" 
                      : "Envoyer facture"}
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
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
