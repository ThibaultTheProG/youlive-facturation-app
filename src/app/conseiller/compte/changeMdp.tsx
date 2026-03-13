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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fef3e8" }}>
          <Lock className="w-3.5 h-3.5" style={{ color: "#E07C24" }} />
        </div>
        <span className="text-sm font-semibold text-gray-700">Modifier mon mot de passe</span>
      </div>
      <div className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
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
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          <div className="flex justify-end">
            <Button className="bg-orange-strong cursor-pointer" type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
