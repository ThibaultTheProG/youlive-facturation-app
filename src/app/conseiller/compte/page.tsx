"use client";

import { useState } from "react";
import FormParams from "@/app/conseiller/compte/formParams";
import { useAuth } from "../../context/authContext";
import ChangeMDP from "./changeMdp";
import {
  BriefcaseBusiness,
  Building2,
  Lock,
  Receipt,
  User,
  UserRound,
} from "lucide-react";
import {
  CarteOnglets,
  Panneau,
  type Onglet,
} from "@/components/uiCustom/carteOnglets";

const ONGLETS: Onglet[] = [
  { id: "identite", label: "Identité", icon: UserRound },
  { id: "contrat", label: "Contrat & CA", icon: BriefcaseBusiness },
  { id: "fiscalite", label: "Fiscalité", icon: Receipt },
  { id: "recrutement", label: "Facturation recrutement", icon: Building2 },
  { id: "securite", label: "Sécurité", icon: Lock },
];

export default function MonCompte() {
  const { user, loading } = useAuth();
  const [onglet, setOnglet] = useState<string>(ONGLETS[0].id);

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
            <User className="h-5 w-5" style={{ color: "#E07C24" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mon compte</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Gérez vos informations et paramètres personnels
            </p>
          </div>
        </div>

        <CarteOnglets
          libelle="Sections de mon compte"
          onglets={ONGLETS}
          actif={onglet}
          onChange={setOnglet}
        >
          <FormParams user={user} onglet={onglet} />
          <Panneau
            id="securite"
            actif={onglet}
            icon={Lock}
            titre="Mot de passe"
            description="Choisissez un nouveau mot de passe pour votre compte."
          >
            <ChangeMDP />
          </Panneau>
        </CarteOnglets>
      </div>
    </div>
  );
}
