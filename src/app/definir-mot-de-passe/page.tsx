"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  MESSAGE_LONGUEUR_MIN,
} from "@/lib/passwordPolicy";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

/**
 * Page publique d'activation de compte, atteinte via le lien d'invitation
 * envoyé par email (`/api/auth/invitation`). Le jeton présent dans l'URL tient
 * lieu d'authentification : voir `src/lib/passwordSetup.ts`.
 */
function DefinirMotDePasse() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  // L'absence pure et simple de jeton se déduit du rendu, sans passer par
  // l'effet (qui ne doit pas appeler setState de façon synchrone).
  const [verification, setVerification] = useState<"encours" | "ok" | "ko">(
    token ? "encours" : "ko"
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState(token ? "" : "Ce lien n'est pas valide.");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [succes, setSucces] = useState(false);

  // Le lien est validé avant d'afficher le formulaire, pour ne pas faire saisir
  // un mot de passe dans un formulaire qui échouera de toute façon.
  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/set-password?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (response.ok) {
          setVerification("ok");
          return;
        }
        const { error } = await response.json();
        setErreur(error || "Ce lien n'est pas valide.");
        setVerification("ko");
      })
      .catch(() => {
        setErreur("Impossible de vérifier ce lien pour le moment.");
        setVerification("ko");
      });
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErreur("");

    if (password.length < LONGUEUR_MIN_MOT_DE_PASSE) {
      setErreur(MESSAGE_LONGUEUR_MIN);
      return;
    }

    if (password !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setEnvoiEnCours(true);

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErreur(data.error || "Une erreur est survenue.");
        return;
      }

      setSucces(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setErreur("Une erreur est survenue. Réessaie dans un instant.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center">
            Définir mon mot de passe
          </h1>
        </CardHeader>

        <CardContent>
          {verification === "encours" && (
            <p className="text-sm text-center text-gray-600">
              Vérification du lien...
            </p>
          )}

          {verification === "ko" && (
            <p className="text-sm text-center text-red-600">{erreur}</p>
          )}

          {verification === "ok" && succes && (
            <p className="text-sm text-center text-green-600">
              Mot de passe enregistré. Redirection vers la page de connexion...
            </p>
          )}

          {verification === "ok" && !succes && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={`${LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
                <Input
                  id="confirmation"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </div>

              {erreur && (
                <p className="text-sm text-red-600 text-center">{erreur}</p>
              )}

              <Button
                type="submit"
                disabled={envoiEnCours}
                className="w-full bg-orange-strong cursor-pointer"
              >
                {envoiEnCours ? "Enregistrement..." : "Valider"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter>
          <p className="text-sm text-center text-gray-600">
            Besoin d&apos;aide ? Contactez : thibault.tuffin@websmith.fr
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <DefinirMotDePasse />
    </Suspense>
  );
}
