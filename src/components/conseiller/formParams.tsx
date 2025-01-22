"use client";

import { useEffect, useState } from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/uiCustom/radioCustom";
import { Button } from "@/components/ui/button";
import { Conseiller, User } from "@/lib/types";
import getConseillerBDD from "@/backend/gestionConseiller";
import { updateConseillerBDD } from "@/backend/gestionConseillers";
//import { set } from "zod";
import { calculRetrocession } from "@/utils/calculs";

export default function FormParams({ user }: { user: User }) {
  const [localConseiller, setLocalConseiller] = useState<Conseiller | null>(
    null
  );
  const [assujettiTVA, setAssujettiTVA] = useState("non");
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [retrocession, setRetrocession] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Récupération des informations du conseiller
  useEffect(() => {
    const fetchConseillers = async () => {
      if (!user || !user.id) {
        console.error("Utilisateur invalide :", user);
        return;
      }
      const data = await getConseillerBDD({ id: user.id });
      setLocalConseiller(data as Conseiller);
      setAssujettiTVA(data?.tva ? "oui" : "non");
      setChiffreAffaires(data?.chiffre_affaires ?? 0);
      setRetrocession(data?.retrocession ?? 0);
    };
    fetchConseillers();
  }, [user]);

  // Calculer la rétrocession à chaque changement de chiffre d'affaires
  useEffect(() => {
    if (chiffreAffaires > 0 && localConseiller?.typecontrat) {
      setRetrocession(
        calculRetrocession(localConseiller.typecontrat, chiffreAffaires)
      );
    } else {
      setRetrocession(0); // Réinitialiser si une des conditions n'est pas remplie
    }
  }, [chiffreAffaires, localConseiller?.typecontrat]);

  const handleSubmit = async (formData: FormData) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      setLoading(true);
      await updateConseillerBDD(formData, user.id);
      const updatedConseiller = await getConseillerBDD({ id: user.id });
      setLocalConseiller(updatedConseiller as Conseiller);
      console.log("Conseiller mis à jour avec succès.");
      setSuccessMessage("Conseiller mis à jour avec succès.");
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour ou du rechargement :",
        error
      );
      setErrorMessage("Erreur lors de la mise à jour ou du rechargement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-row justify-start space-x-4">
          <InputCustom
            disable={true}
            name="nom"
            label="Nom"
            id="nom"
            type="text"
            value={localConseiller?.nom ?? ""}
          />
          <InputCustom
            disable={true}
            name="prenom"
            label="Prénom"
            id="prenom"
            type="text"
            value={localConseiller?.prenom ?? ""}
          />
          <InputCustom
            disable={true}
            name="id_apimo"
            label="ID Apimo"
            id="id_apimo"
            type="number"
            value={localConseiller?.idapimo ?? ""}
          />
        </div>
        <div className="flex flex-row justify-start space-x-4">
          <InputCustom
            disable={true}
            name="email"
            label="Email"
            id="email"
            type="email"
            value={localConseiller?.email ?? ""}
          />
          <InputCustom
            disable={true}
            name="telephone"
            label="Téléphone"
            id="telephone"
            type="tel"
            value={localConseiller?.telephone ?? ""}
          />
          <InputCustom
            disable={false}
            name="localisation"
            label="Localisation / Adresse"
            id="localisation"
            value={localConseiller?.adresse ?? ""}
            onChange={(val) =>
              setLocalConseiller((prev) =>
                prev ? { ...prev, adresse: String(val) } : prev
              )
            }
          />
        </div>
        <div className="flex flex-row justify-between space-x-4">
          <InputCustom
            disable={false}
            name="siren"
            label="SIREN"
            id="siren"
            type="number"
            value={localConseiller?.siren ?? ""}
            onChange={(val) =>
              setLocalConseiller((prev) =>
                prev ? { ...prev, siren: Number(val) } : prev
              )
            }
          />
          <div className="flex flex-col justify-start space-y-2">
            <Label>Assujéti à la TVA</Label>
            <RadioCustom
              onChange={(value) => setAssujettiTVA(value)}
              value={assujettiTVA}
              name="assujetti_tva"
            />
          </div>
          <div className="flex flex-col justify-start space-y-2">
            <InputCustom
              disable={true}
              name="type_contrat"
              label="Type de contrat"
              id="type_contrat"
              type="text"
              value={localConseiller?.typecontrat ?? ""}
            />
          </div>
        </div>
        <div className="flex flex-row justify-between  space-x-4">
          <InputCustom
            disable={false}
            name="chiffre_affaire_annuel"
            label="Chiffre d'affaire annuel"
            id="chiffre_affaire_annuel"
            type="number"
            value={chiffreAffaires}
            onChange={(val) => setChiffreAffaires(Number(val))}
          />
          <InputCustom
            disable={true}
            name="retrocession"
            label="% de rétrocession"
            id="retrocession"
            type="number"
            value={retrocession}
          />
        </div>
      </div>
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
      {successMessage && <p className="text-green-600">{successMessage}</p>}
      <Button className="bg-orangeStrong" type="submit" disabled={loading}>
        {loading ? "Chargement..." : "Valider"}
      </Button>
    </form>
  );
}
