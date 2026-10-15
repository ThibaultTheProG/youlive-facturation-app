"use client";

import InputPassword from "@/components/uiCustom/inputPassword";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  MESSAGE_LONGUEUR_MIN,
} from "@/lib/passwordPolicy";

export default function ChangeMDP() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < LONGUEUR_MIN_MOT_DE_PASSE) {
      setErrorMessage(MESSAGE_LONGUEUR_MIN);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Une erreur est survenue.");
        return;
      }

      setSuccessMessage("Votre mot de passe a été modifié avec succès !");
    } catch (error) {
      console.error("Erreur lors de la modification du mot de passe :", error);
      setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="max-w-3xl space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputPassword
          label="Nouveau mot de passe"
          name="password"
          id="password"
          type="password"
          value={password}
          onChange={(val) => setPassword(val)}
        />
        <InputPassword
          label="Confirmer le mot de passe"
          name="confirmPass"
          id="confirmPass"
          type="password"
          value={confirmPassword}
          onChange={(val) => setConfirmPassword(val)}
        />
      </div>
      <p className="text-xs text-gray-400">{MESSAGE_LONGUEUR_MIN}</p>
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {successMessage && (
        <p className="text-sm text-green-600">{successMessage}</p>
      )}
      <div className="flex justify-end">
        <Button
          className="bg-orange-strong cursor-pointer"
          type="submit"
          disabled={loading}
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
