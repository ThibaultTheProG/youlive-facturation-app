"use client";

import FormParams from "@/components/conseiller/formParams";
import { useAuth } from "../../context/authContext";
import ChangeMDP from "@/components/conseiller/changeMdp";

export default function MonCompte() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p>Chargement en cours...</p> {/* Indicateur de chargement simple */}
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
      <h1 className="text-2xl font-bold">Mon compte</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Mes informations</h2>
          <FormParams user={user} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Changer mon mot de passe</h2>
          <ChangeMDP />
        </section>
      </div>
    </div>
  );
}