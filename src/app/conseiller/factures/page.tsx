"use client";

import { useAuth } from "../../context/authContext";
import TableauFactures from "./tableauFactures";
import { FileCheck, Info } from "lucide-react";

export default function MesFactures() {
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
      <div className="px-6 py-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#fef3e8" }}>
            <FileCheck className="w-5 h-5" style={{ color: "#E07C24" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mes factures</h1>
            <p className="text-sm text-gray-500 mt-0.5">Consultez et envoyez vos factures générées</p>
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Le montant affiché de la rétrocession HT ne prend pas en compte le montant soustrait pour l&apos;apporteur d&apos;affaire. Vous verrez le montant réellement perçu directement dans la facture générée.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 overflow-x-auto">
          <TableauFactures user={user} />
        </div>
      </div>
    </div>
  );
}
