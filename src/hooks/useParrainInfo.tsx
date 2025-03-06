import { useState, useEffect } from "react";
import { getParrainLevel } from "@/backend/gestionConseillers";

export default function useParrainInfo(conseillerId: number | undefined, niveau: number) {
    const [parrainName, setParrainName] = useState<string>("Aucun");
    const [parrainId, setParrainId] = useState<number | null>(null);
    
    useEffect(() => {
      if (!conseillerId) return;
      
      const fetchParrainInfo = async () => {
        try {
          const { id, nom } = await getParrainLevel(conseillerId, niveau);
          setParrainName(nom);
          setParrainId(id);
        } catch (error) {
          console.error(`Erreur lors de la récupération du parrain niveau ${niveau}:`, error);
          setParrainName("Aucun");
          setParrainId(null);
        }
      };
      
      fetchParrainInfo();
    }, [conseillerId, niveau]);
    
    return { parrainName, parrainId, setParrainName, setParrainId };
  }