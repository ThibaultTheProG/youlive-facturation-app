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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; // Nombre de filleuls par page

  useEffect(() => {
    const fetchFilleuls = async () => {
      try {
        if (!user || !user.id) return;
        
        const response = await fetch(`/api/filleuls?conseillerId=${user.id}`);
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
  }, [user]);

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
      <Table>
        <TableCaption>Liste des filleuls de {user.name}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>{"Chiffre d'affaires"} (€)</TableHead>
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