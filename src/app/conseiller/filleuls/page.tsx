"use client"

import TableauFilleuls from "./tableauFilleuls";
import { useAuth } from "../../context/authContext";
import { Users } from "lucide-react";

export default function MesFilleulsPage() {
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
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#fef3e8" }}>
            <Users className="h-5 w-5" style={{ color: "#E07C24" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mes filleuls</h1>
            <p className="mt-0.5 text-sm text-gray-500">Conseillers parrainés et leurs chiffres d&apos;affaires</p>
          </div>
        </div>

        <TableauFilleuls user={user} />
      </div>
    </div>
  );
}
