"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/lib/types";

interface Filleul {
  id: number;
  prenom: string;
  nom: string;
  chiffre_affaires: number;
  niveau: string;
}

export default function TableauFilleuls({ user }: { user: User }) {
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; // Nombre de filleuls par page

  // Récupérer les années disponibles
  useEffect(() => {
    const fetchYears = async () => {
      try {
        if (!user || !user.id) return;

        const response = await fetch(`/api/conseiller/annees?id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableYears(data.annees || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des années:", error);
      }
    };

    fetchYears();
  }, [user]);

  useEffect(() => {
    const fetchFilleuls = async () => {
      try {
        if (!user || !user.id) return;

        const currentYear = new Date().getFullYear();
        const url = selectedYear === currentYear
          ? `/api/filleuls?conseillerId=${user.id}`
          : `/api/filleuls?conseillerId=${user.id}&annee=${selectedYear}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur lors de la récupération des filleuls");

        const data = await response.json();
        setFilleuls(data);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des filleuls :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilleuls();
  }, [user, selectedYear]);

  // Tri des filleuls par niveau (en supposant que niveau est une chaîne)
  filleuls.sort((a, b) => a.niveau.localeCompare(b.niveau));

  // Pagination - Filtrage des filleuls affichés sur la page actuelle
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentFilleuls = filleuls.slice(indexOfFirstRow, indexOfLastRow);

  

  // Gestion des pages
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filleuls.length / rowsPerPage)));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  if (loading) return <p>Chargement des filleuls...</p>;

  return (
    <div>
      {/* Sélecteur d'année */}
      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="year_selector_filleuls" className="font-medium text-sm">
          Consulter l'année :
        </label>
        <select
          id="year_selector_filleuls"
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(Number(e.target.value));
            setCurrentPage(1); // Reset pagination lors du changement d'année
          }}
          className="border border-gray-300 rounded-md p-2 bg-white"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year} {year === new Date().getFullYear() && "(Année en cours)"}
            </option>
          ))}
        </select>
      </div>

      <Table>
        <TableCaption>Liste des filleuls de {user.name} - {selectedYear}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>{"Chiffre d'affaires"} ({selectedYear}) (€)</TableHead>
            <TableHead>Ligne de parrainage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentFilleuls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center">
                Aucun filleul trouvé
              </TableCell>
            </TableRow>
          ) : (
            currentFilleuls.map((filleul) => (
              <TableRow key={filleul.id}>
                <TableCell>{filleul.prenom} {filleul.nom}</TableCell>
                <TableCell>{filleul.chiffre_affaires <= 70000 ? filleul.chiffre_affaires?.toLocaleString() : "70 000"} €</TableCell>
                <TableCell>{filleul.niveau}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {filleuls.length > rowsPerPage && (
        <div className="flex justify-center mt-4 space-x-4">
          <button 
            onClick={prevPage} 
            disabled={currentPage === 1} 
            className={`px-4 py-2 border rounded ${currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-orange-strong text-white hover:bg-orange-light cursor-pointer"}`}
          >
            Précédent
          </button>
          <span className="px-4 py-2 border rounded">
            Page {currentPage} / {Math.ceil(filleuls.length / rowsPerPage)}
          </span>
          <button 
            onClick={nextPage} 
            disabled={currentPage === Math.ceil(filleuls.length / rowsPerPage)} 
            className={`px-4 py-2 border rounded ${currentPage === Math.ceil(filleuls.length / rowsPerPage) ? "bg-gray-300 cursor-not-allowed" : "bg-orange-strong text-white hover:bg-orange-light cursor-pointer"}`}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}