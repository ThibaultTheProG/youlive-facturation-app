import { useState, useEffect } from "react";
import { Conseiller } from "@/lib/types";
import { getConseillersBDD } from "@/backend/gestionConseillers";
import { toast } from "react-hot-toast";

export default function useConseillers() {
    const [conseillers, setConseillers] = useState<Conseiller[]>([]);
    
    useEffect(() => {
      const fetchConseillers = async () => {
        try {
          const data = await getConseillersBDD();
          setConseillers(data || []);
        } catch (error) {
          console.error("Erreur lors de la récupération des conseillers:", error);
          toast.error("Impossible de charger les conseillers");
        }
      };
  
      fetchConseillers();
    }, []);
    
    return conseillers;
  }
  