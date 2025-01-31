"use client";

import { useAuth } from "../../context/authContext";
import TableauFactures from "@/components/conseiller/tableauFactures";

export default function MesFactures() {
  const { user, loading } = useAuth();

  console.log("Utilisateur dans MesFactures :", user);

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
      <h1>Mes factures</h1>
      <TableauFactures user={user} />
    </div>
  );
}