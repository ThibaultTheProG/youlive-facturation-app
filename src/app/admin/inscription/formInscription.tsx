"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import SelectCustom from "@/components/uiCustom/selectCustom";
import { getConseillersBDD } from "@/backend/gestionConseillers";
import { Conseiller, SelectItem } from "@/lib/types";

export default function FormInscription() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localConseillers, setLocalConseillers] = useState<Conseiller[]>([]);
  const [selectedConseiller, setSelectedConseiller] =
    useState<Conseiller | null>(null);
  const [password, setPassword] = useState("");

  // Récupérer les conseillers depuis la BDD
  useEffect(() => {
    const fetchConseillers = async () => {
      const data = await getConseillersBDD();
      setLocalConseillers(data);
    };

    fetchConseillers();
  }, []);

  // Générer le tableau des conseillers
  const conseillersNoms: SelectItem[] = localConseillers.map((conseiller) => ({
    key: conseiller.idapimo,
    name: `${conseiller.prenom} ${conseiller.nom}`,
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Gérer la sélection du conseiller
  const handleSelectConseiller = async (val: string) => {
    const conseiller = localConseillers.find(
      (c) => `${c.prenom} ${c.nom}` === val
    );
    setSelectedConseiller(conseiller || null);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedConseiller || !password) {
      setErrorMessage("Veuillez sélectionner un conseiller et entrer un mot de passe.");
      return;
    }

    try {
      const response = await fetch("/api/assignPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conseillerId: selectedConseiller.idapimo,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setSuccessMessage(data.message);
      setPassword(""); // Réinitialiser le champ
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    }
  };

  return (
    <Card className="w-full max-w-md p-6 shadow-lg">
      <CardHeader>
        <h1 className="text-2xl font-semibold text-center">
          Attribuer un mot de passe
        </h1>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="conseiller">Sélectionner un conseiller</Label>
            <SelectCustom
              placeholder="Sélectionner un conseiller"
              selectLabel="Conseillers"
              options={conseillersNoms}
              value={
                selectedConseiller
                  ? `${selectedConseiller.prenom} ${selectedConseiller.nom}`
                  : ""
              }
              onChange={handleSelectConseiller}
            />
          </div>
          <div>
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Entrez le mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {successMessage && (
            <p className="text-sm text-green-600 text-center">
              {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="text-sm text-red-600 text-center">{errorMessage}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-strong"
            disabled={!selectedConseiller || !password}
          >
            Attribuer
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center text-gray-600">
          Cette action attribuera un mot de passe à un conseiller.
        </p>
      </CardFooter>
    </Card>
  );
}