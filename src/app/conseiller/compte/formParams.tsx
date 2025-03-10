"use client";

import { useEffect, useState } from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/uiCustom/radioCustom";
import { Button } from "@/components/ui/button";
import { Conseiller, User } from "@/lib/types";
import { toast } from "react-hot-toast";
import { calculRetrocession } from "@/utils/calculs";

export default function FormParams({ user }: { user: User }) {
  const [conseiller, setConseiller] = useState<Conseiller | null>(null);
  const [assujettiTVA, setAssujettiTVA] = useState<string>("non");
  const [autoParrain, setAutoParrain] = useState<string>("non");
  const [selectedTypeContrat, setSelectedTypeContrat] = useState<string>("");
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [retrocession, setRetrocession] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer les informations du conseiller
  useEffect(() => {
    const fetchConseillers = async () => {
      try {
        const response = await fetch(`/api/conseiller?id=${user.id}`);
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération du conseiller");
        }
        
        const data = await response.json();
        setConseiller(data);
        
        if (data) {
          setAssujettiTVA(data.tva ? "oui" : "non");
          setAutoParrain(data.auto_parrain || "non");
          setSelectedTypeContrat(data.typecontrat || "");
          setChiffreAffaires(data.chiffre_affaires || 0);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du conseiller:", error);
        toast.error("Impossible de récupérer les informations du conseiller");
      }
    };

    if (user?.id) {
      fetchConseillers();
    }
  }, [user?.id]);

  console.log(conseiller);

  // Calculer la rétrocession à chaque changement de chiffre d'affaires ou de type de contrat
  useEffect(() => {
    if (chiffreAffaires >= 0 && selectedTypeContrat) {
      setRetrocession(
        calculRetrocession(selectedTypeContrat, chiffreAffaires, autoParrain)
      );
    } else {
      setRetrocession(0); // Réinitialiser si une des conditions n'est pas remplie
    }
  }, [chiffreAffaires, selectedTypeContrat, autoParrain]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // Préparation des données pour l'API
      const conseillerData = {
        id: user.id,
        prenom: conseiller?.prenom,
        nom: conseiller?.nom,
        email: conseiller?.email,
        telephone: conseiller?.telephone,
        adresse: formData.get("localisation")?.toString() || conseiller?.adresse || null,
        siren: conseiller?.siren?.toString() || null,
        tva: formData.get("tva") === "oui",
        typecontrat: formData.get("type_contrat")?.toString() || null,
        chiffre_affaires: chiffreAffaires,
        retrocession: retrocession,
        auto_parrain: formData.get("auto_parrain")?.toString() || "non",
      };
      
      console.log("Données envoyées à l'API:", conseillerData);
      
      // Appel à l'API
      const response = await fetch("/api/conseillers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conseillerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      // Recharger les données du conseiller
      const conseillerResponse = await fetch(`/api/conseiller?id=${user.id}`);
      if (!conseillerResponse.ok) {
        throw new Error("Erreur lors de la récupération des données mises à jour");
      }
      const updatedData = await conseillerResponse.json();
      setConseiller(updatedData);
      
      // ✅ Affichage du message de succès
      setSuccessMessage("Les modifications ont bien été enregistrées !");
      setTimeout(() => setSuccessMessage(null), 3000); // Masquer après 3 secondes
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      toast.error("Une erreur est survenue lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
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
            value={conseiller?.nom ?? ""}
          />
          <InputCustom
            disable={true}
            name="prenom"
            label="Prénom"
            id="prenom"
            type="text"
            value={conseiller?.prenom ?? ""}
          />
          <InputCustom
            disable={true}
            name="id_apimo"
            label="ID Apimo"
            id="id_apimo"
            type="number"
            value={conseiller?.idapimo ?? ""}
          />
        </div>
        <div className="flex flex-row justify-start space-x-4">
          <InputCustom
            disable={true}
            name="email"
            label="Email"
            id="email"
            type="email"
            value={conseiller?.email ?? ""}
          />
          {conseiller?.telephone && (
            <InputCustom
              disable={true}
              name="telephone"
              label="Téléphone"
              id="telephone"
              type="tel"
              value={conseiller?.telephone ?? ""}
            />
          )}
          {conseiller?.mobile && (
            <InputCustom
              disable={true}
              name="mobile"
              label="Mobile"
              id="mobile"
              type="mobile"
              value={conseiller?.mobile ?? ""}
            />
          )}
          <InputCustom
            disable={false}
            name="localisation"
            label="Localisation / Adresse"
            id="localisation"
            value={conseiller?.adresse ?? ""}
            onChange={(val) =>
              setConseiller((prev) =>
                prev ? { ...prev, adresse: String(val) } : prev
              )
            }
          />
        </div>
        <div className="flex flex-row space-x-4">
          <InputCustom
            disable={false}
            name="siren"
            label="SIREN / RSAC / RCS"
            id="siren"
            type="number"
            value={conseiller?.siren ?? ""}
            onChange={(val) =>
              setConseiller((prev) =>
                prev ? { ...prev, siren: Number(val) } : prev
              )
            }
          />
          <div className="flex flex-col justify-start space-y-2">
            <InputCustom
              disable={true}
              name="type_contrat"
              label="Type de contrat"
              id="type_contrat"
              type="text"
              value={selectedTypeContrat}
              onChange={(val) => setSelectedTypeContrat(String(val))}
            />
          </div>
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

        <div className="flex flex-col justify-start space-y-2">
          <Label>Assujéti à la TVA</Label>
          <RadioCustom
            onChange={(value) => setAssujettiTVA(value)}
            value={assujettiTVA}
            name="tva"
          />
        </div>
        <div className="flex flex-col justify-start space-y-2">
          <Label>Auto parrain</Label>
          <RadioCustom
            onChange={(value) => setAutoParrain(value)}
            value={autoParrain}
            name="auto_parrain"
          />
        </div>
      </div>
      {successMessage && <p className="text-green-600">{successMessage}</p>}
      <Button className="bg-orange-strong" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Chargement..." : "Valider"}
      </Button>
    </form>
  );
}
