"use client";

import { useEffect, useState } from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import SelectCustom from "@/components/uiCustom/selectCustom";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/uiCustom/radioCustom";
import { Button } from "@/components/ui/button";
import { Conseiller, SelectItem } from "@/lib/types";
import {
  getConseillersBDD,
  updateConseillerBDD,
  handleParrainages,
  getParrainLevel,
} from "@/backend/gestionConseillers";
import { calculRetrocession } from "@/utils/calculs";

export default function FormParams() {
  const [localConseillers, setLocalConseillers] = useState<Conseiller[]>([]);
  const [selectedParrain, setSelectedParrain] = useState<string>("Aucun");
  const [selectedParrainId, setSelectedParrainId] = useState<number | null>(
    null
  );
  const [assujettiTVA, setAssujettiTVA] = useState<string>("non");
  const [autoParrain, setAutoParrain] = useState<string>("non");
  const [selectedConseiller, setSelectedConseiller] =
    useState<Conseiller | null>(null);
  const [selectedTypeContrat, setSelectedTypeContrat] = useState<string>("");
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [retrocession, setRetrocession] = useState<number>(0);
  const [parrainNiveau2, setParrainNiveau2] = useState<string>("Aucun");
  const [parrainNiveau3, setParrainNiveau3] = useState<string>("Aucun");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Récupérer les conseillers depuis la BDD
  useEffect(() => {
    const fetchConseillers = async () => {
      const data = await getConseillersBDD();
      setLocalConseillers(data);
    };

    fetchConseillers();
  }, []);

  // Synchroniser les champs lorsque `selectedConseiller` change
  useEffect(() => {
    if (selectedConseiller) {
      const { typecontrat, chiffre_affaires, tva, parrain_id, auto_parrain } =
        selectedConseiller;

      setSelectedTypeContrat(typecontrat || "");
      setChiffreAffaires(chiffre_affaires || 0);
      setAssujettiTVA(tva ? "oui" : "non");
      if (auto_parrain) {
        setAutoParrain(auto_parrain);
        setRetrocession(
          chiffre_affaires && typecontrat
            ? calculRetrocession(typecontrat, chiffre_affaires, auto_parrain)
            : 0
        );
      }

      // Mettre à jour le parrain sélectionné
      const parrain = localConseillers.find((c) => c.id === parrain_id);
      setSelectedParrain(
        parrain ? `${parrain.prenom} ${parrain.nom}` : "Aucun"
      );
      setSelectedParrainId(parrain?.id || null);

      if (selectedConseiller?.id) {
        // Récupérer le parrain de niveau 2
        getParrainLevel(selectedConseiller.id, 2)
          .then((parrain) => setParrainNiveau2(parrain))
          .catch((error) => {
            console.error(
              "Erreur lors de la récupération du parrain de niveau 2 :",
              error
            );
            setParrainNiveau2("Aucun");
          });

        // Récupérer le parrain de niveau 3
        getParrainLevel(selectedConseiller.id, 3)
          .then((parrain) => setParrainNiveau3(parrain))
          .catch((error) => {
            console.error(
              "Erreur lors de la récupération du parrain de niveau 3 :",
              error
            );
            setParrainNiveau3("Aucun");
          });
      } else {
        // Réinitialiser les valeurs si aucun conseiller n'est sélectionné
        setParrainNiveau2("Aucun");
        setParrainNiveau3("Aucun");
      }
    } else {
      // Réinitialiser les valeurs si aucun conseiller sélectionné
      setSelectedTypeContrat("");
      setChiffreAffaires(0);
      setAssujettiTVA("non");
      setAutoParrain("non");
      setRetrocession(0);
      setSelectedParrain("Aucun");
      setSelectedParrainId(null);
    }
  }, [selectedConseiller, localConseillers]);

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

  // Générer le tableau des conseillers et classer par ordre alphabétique
  const conseillersNoms: SelectItem[] = localConseillers
    .map((conseiller) => ({
      key: conseiller.id,
      name: `${conseiller.prenom} ${conseiller.nom}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Exclure le conseiller sélectionné de la liste des parrains et classer par ordre alphabétique
  const parrains: { key: number; name: string }[] = localConseillers
    .filter((c) => c.id !== selectedConseiller?.id)
    .map((c) => ({
      key: c.id!,
      name: `${c.prenom} ${c.nom}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Gérer la sélection du parrain
  const handleSelectParrain = async (val: string) => {
    setSelectedParrain(val);
    const parrain = localConseillers.find(
      (c) => `${c.prenom} ${c.nom}` === val
    );
    setSelectedParrainId(parrain?.id || null);
  };

  // Gérer la sélection du conseiller
  const handleSelectConseiller = async (val: string) => {
    const conseiller = localConseillers.find(
      (c) => `${c.prenom} ${c.nom}` === val
    );
    setSelectedConseiller(conseiller || null);
  };

  // Recharger les conseillers après soumission
  const handleFormSubmit = async (formData: FormData) => {
    try {
      // Mise à jour des informations du conseiller dans la BDD
      await updateConseillerBDD(
        formData,
        selectedConseiller?.id as number,
        selectedParrainId
      );

      // Gérer les parrainages de niveau 2 et 3 pour le parrain sélectionné
      if (selectedParrainId) {
        await handleParrainages(selectedParrain, selectedParrainId); // Utiliser selectedParrainId comme conseillerId
      }

      console.log(
        "Parrain : ",
        selectedParrain,
        "id du parrain :",
        selectedParrainId
      );

      // Recharger les conseillers après mise à jour
      const updatedConseillers: Conseiller[] = await getConseillersBDD();
      setLocalConseillers(updatedConseillers);

      // Mettre à jour le conseiller sélectionné si existant
      const updatedConseiller = updatedConseillers.find(
        (c: Conseiller) => c.id === Number(formData.get("id"))
      );
      setSelectedConseiller(updatedConseiller || null);
      // ✅ Affichage du message de succès
      setSuccessMessage("Les modifications ont bien été enregistrées !");
      setTimeout(() => setSuccessMessage(null), 3000); // Masquer après 3 secondes
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour ou du rechargement :",
        error
      );
    }
  };

  return (
    <form action={handleFormSubmit} className="space-y-8">
      <SelectCustom
        placeholder="Sélectionner un conseiller"
        selectLabel="Conseillers"
        options={conseillersNoms} // Utilisation de "options" au lieu de "value"
        value={
          selectedConseiller
            ? `${selectedConseiller.prenom} ${selectedConseiller.nom}`
            : ""
        } // Valeur actuelle sélectionnée
        onChange={handleSelectConseiller}
      />
      <div className="flex flex-col space-y-8">
        <div className="flex flex-row justify-start space-x-4">
          <InputCustom
            disable={true}
            name="nom"
            label="Nom"
            id="nom"
            type="text"
            value={selectedConseiller?.nom || ""}
          />
          <InputCustom
            disable={true}
            name="prenom"
            label="Prénom"
            id="prenom"
            type="text"
            value={selectedConseiller?.prenom || ""}
          />
          <InputCustom
            disable={true}
            name="id"
            label="ID dans l'application"
            id="id"
            type="number"
            value={selectedConseiller?.id || ""}
          />
        </div>
        <div className="flex flex-row justify-start space-x-4">
          <InputCustom
            disable={true}
            name="email"
            label="Email"
            id="email"
            type="email"
            value={selectedConseiller?.email || ""}
          />
          <InputCustom
            disable={true}
            name="telephone"
            label="Téléphone"
            id="telephone"
            type="tel"
            value={selectedConseiller?.telephone || ""}
          />
          <InputCustom
            disable={true}
            name="mobile"
            label="Mobile"
            id="mobile"
            type="tel"
            value={selectedConseiller?.mobile || ""}
          />
          <InputCustom
            disable={false}
            name="localisation"
            label="Localisation / Adresse"
            id="localisation"
            value={selectedConseiller?.adresse || ""}
            onChange={(val) =>
              setSelectedConseiller((prev) =>
                prev ? { ...prev, adresse: String(val) } : prev
              )
            }
          />
        </div>
        <div className="flex flex-row space-x-4">
          <InputCustom
            disable={false}
            name="siren"
            label="SIREN"
            id="siren"
            type="number"
            value={selectedConseiller?.siren || ""}
            onChange={(val) =>
              setSelectedConseiller((prev) =>
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
            <Label>Auto parrainé ?</Label>
            <RadioCustom
              onChange={(value) => setAutoParrain(value)}
              value={autoParrain}
              name="auto_parrain"
            />
          </div>
        </div>
        <div className="flex flex-row  space-x-4">
          <div className="flex flex-col justify-start space-y-2">
            <Label>Type de contrat</Label>
            <SelectCustom
              placeholder="Sélectionner un type de contrat"
              selectLabel="Type de contrat"
              options={["Offre Youlive", "Offre Découverte"]} // Options disponibles
              value={selectedTypeContrat || ""} // Valeur sélectionnée (chaîne unique)
              name="type_contrat"
              onChange={(val) => setSelectedTypeContrat(val)}
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
        <div className="flex flex-row justify-center items-end space-x-4">
          <SelectCustom
            placeholder="Sélectionner un parrain"
            selectLabel="Parrains"
            options={parrains} // Exclut le conseiller lui-même
            value={selectedParrain}
            name="parrain"
            onChange={handleSelectParrain}
          />

          <InputCustom
            disable={true}
            label="Parrain de niveau 1"
            id="parrain1"
            type="text"
            value={selectedParrain || "Aucun"} // Affiche le parrain sélectionné ou "Aucun"
          />
          <InputCustom
            disable={true}
            label="Parrain de niveau 2"
            id="parrain2"
            type="text"
            value={parrainNiveau2} // Utilise l'état pour la valeur
          />
          <InputCustom
            disable={true}
            label="Parrain de niveau 3"
            id="parrain3"
            type="text"
            value={parrainNiveau3} // Utilise l'état pour la valeur
          />
        </div>
      </div>
      {successMessage && (
        <p className="text-green-600">{successMessage}</p>
      )}
      <Button className="bg-orange-strong" type="submit">
        Valider
      </Button>
    </form>
  );
}
