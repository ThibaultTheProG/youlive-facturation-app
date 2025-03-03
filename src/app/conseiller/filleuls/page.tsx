"use client"

import TableauFilleuls from "./tableauFilleuls";
import { useAuth } from "../../context/authContext";

export default function MesFilleulsPage() {
      const { user, loading } = useAuth();
    
      if (loading) {
        return (
          <div className="container mx-auto p-4">
            <p>Chargement en cours...</p>
          </div>
        );
      }
    
      if (!user) {
        return (
          <div className="container mx-auto p-4">
            <p>Erreur : utilisateur non connecté.</p>
          </div>
        );
      }
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Mes filleuls</h1>
      <TableauFilleuls user={user}/>
    </div>
  );
}
