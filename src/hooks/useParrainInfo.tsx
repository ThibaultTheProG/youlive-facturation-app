import { useState, useEffect } from "react";

export default function useParrainInfo(conseillerId: number | undefined, niveau: number) {
    const [parrainName, setParrainName] = useState<string>("Aucun");
    const [parrainId, setParrainId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      if (!conseillerId) return;
      
      const fetchParrainInfo = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          // Utilisation de la nouvelle route API
          const response = await fetch(`/api/conseillers/getParrain?idConseiller=${conseillerId}&niveau=${niveau}`, {
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
          setParrainName(data.nom);
          setParrainId(data.id);
        } catch (error) {
          console.error(`Erreur lors de la récupération du parrain niveau ${niveau}:`, error);
          setParrainName("Aucun");
          setParrainId(null);
          setError(error instanceof Error ? error.message : String(error));
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchParrainInfo();
    }, [conseillerId, niveau]);
    
    return { parrainName, parrainId, isLoading, error };
}