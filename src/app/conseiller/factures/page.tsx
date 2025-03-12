"use client";

import { useAuth } from "../../context/authContext";
import TableauFactures from "./tableauFactures";

export default function MesFactures() {
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
      <h1 className="text-2xl font-bold">Mes factures</h1>
      <p className="text-sm text-gray-500">
        {
          "Le montant affiché de la rétrocession HT ne prend pas en compte le montant soustrait pour l'apporteur d'affaire. Vous verrez le montant de la rétrocession réellement perçu directement dans la facture générée."
        }
      </p>
      <TableauFactures user={user} />
    </div>
  );
}
