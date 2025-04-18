"use client"

import FormParams from "@/app/admin/parametres/formParams";
import { useAuth } from "../../context/authContext";

export default function Parametres() {

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
      <h1 className="text-lg font-semibold mb-4">Paramètres des conseillers</h1>
      <FormParams />
    </div>
  );
}
