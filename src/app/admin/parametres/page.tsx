"use client"

import FormParams from "@/app/admin/parametres/formParams";
import { useAuth } from "../../context/authContext";
import { Settings } from "lucide-react";

export default function Parametres() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#E07C24", borderTopColor: "transparent" }} />
          <span className="text-sm">Chargement en cours...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">Erreur : utilisateur non connecté.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#fef3e8" }}>
            <Settings className="w-5 h-5" style={{ color: "#E07C24" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Paramètres des conseillers</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gérez les contrats, la TVA et les parrainages de chaque conseiller</p>
          </div>
        </div>
        <FormParams />
      </div>
    </div>
  );
}
