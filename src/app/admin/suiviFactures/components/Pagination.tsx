import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Composant pour la pagination
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Ne pas afficher la pagination s'il n'y a qu'une seule page
  if (totalPages <= 1) return null;

  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Si le nombre total de pages est inférieur ou égal au nombre maximum de pages à afficher,
      // afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Sinon, afficher un sous-ensemble de pages avec des ellipses
      if (currentPage <= 3) {
        // Si la page actuelle est proche du début
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Si la page actuelle est proche de la fin
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Si la page actuelle est au milieu
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2">...</span>
        ) : (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            className="min-w-[2rem]"
          >
            {page}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination; 