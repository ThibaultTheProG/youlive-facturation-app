"use client";

import { useAuth } from "../../context/authContext";
import TableauSuiviFactures from "@/app/admin/suiviFactures/tableauSuiviFactures";

export default function SuiviFactures() {
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
    <>
      <TableauSuiviFactures />
    </>
  );
}
