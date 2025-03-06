import { useState, useEffect } from "react";
import { Conseiller } from "@/lib/types";
import { toast } from "react-hot-toast";

export default function useConseillers() {
    const [conseillers, setConseillers] = useState<Conseiller[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      const fetchConseillers = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await fetch('/api/conseillers/get', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-store'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          setConseillers(data || []);
        } catch (error) {
          console.error("Erreur lors de la récupération des conseillers:", error);
          setError(error instanceof Error ? error.message : String(error));
          toast.error("Impossible de charger les conseillers");
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchConseillers();
    }, []);
    
    return { conseillers, isLoading, error };
}
  