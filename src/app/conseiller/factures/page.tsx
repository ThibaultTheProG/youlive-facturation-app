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
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#E07C24", borderTopColor: "transparent" }}
          />
          <span className="text-sm">Chargement en cours...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">
          Erreur : utilisateur non connecté.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#fef3e8" }}
          >
            <FileCheck className="h-5 w-5" style={{ color: "#E07C24" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mes factures</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Consultez et envoyez vos factures générées
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <p className="text-sm leading-relaxed text-sky-800">
            La rétrocession HT affichée ne tient pas compte du montant soustrait
            pour l&apos;apporteur d&apos;affaire. Le montant réellement perçu
            figure dans la facture générée.
          </p>
        </div>

        <TableauFactures user={user} />
      </div>
    </div>
  );
}
