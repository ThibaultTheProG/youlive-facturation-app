"use client";

import { Lock } from "lucide-react";
import InputPassword from "@/components/uiCustom/inputPassword";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <>
      <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <Lock />
        <h2>Modifier mon mot de passe</h2>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-4">
          <InputPassword
            label="Nouveau mot de passe"
            name="password"
            id="password"
            type="password"
            value={password}
            onChange={(val) => setPassword(val)}
          />
          <InputPassword
            label="Confirmer le nouveau mot de passe"
            name="confirmPass"
            id="confirmPass"
            type="password"
            value={confirmPassword}
            onChange={(val) => setConfirmPassword(val)}
          />
        </div>
        {errorMessage && <p className="text-red-600">{errorMessage}</p>}
        {successMessage && <p className="text-green-600">{successMessage}</p>}
        <Button
          className="bg-orange-strong"
          type="submit"
          disabled={loading}
        >
          {loading ? "Chargement..." : "Valider"}
        </Button>
      </form>
    </div>
    </>
  );
}
