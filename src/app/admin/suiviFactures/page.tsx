"use client";

import { useAuth } from "../../context/authContext";
import TableauSuiviFactures from "@/app/admin/suiviFactures/tableauSuiviFactures";
import { FileCheck } from "lucide-react";

export default function SuiviFactures() {
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
            <FileCheck className="h-5 w-5" style={{ color: "#E07C24" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Suivi des factures</h1>
            <p className="mt-0.5 text-sm text-gray-500">Consultez et gérez l&apos;ensemble des factures générées</p>
          </div>
        </div>
        <TableauSuiviFactures />
      </div>
    </div>
  );
}
