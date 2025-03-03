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
import PopoverCustom from "@/components/uiCustom/popoverCustom";

export default function FormParams() {
  const [localConseillers, setLocalConseillers] = useState<Conseiller[]>([]);
  const [selectedParrain, setSelectedParrain] = useState<string>("Aucun");
  const [selectedParrainId, setSelectedParrainId] = useState<number | null>(
    null
  );
  const [selectedParrain2, setSelectedParrain2] = useState<string>("Aucun");
  const [selectedParrain2Id, setSelectedParrain2Id] = useState<number | null>(
    null
  );
  const [selectedParrain3, setSelectedParrain3] = useState<string>("Aucun");
  const [selectedParrain3Id, setSelectedParrain3Id] = useState<number | null>(
    null
  );
  const [assujettiTVA, setAssujettiTVA] = useState<string>("non");
  const [autoParrain, setAutoParrain] = useState<string>("non");
  const [selectedConseiller, setSelectedConseiller] =
    useState<Conseiller | null>(null);
  const [selectedTypeContrat, setSelectedTypeContrat] = useState<string>("");
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [retrocession, setRetrocession] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openConseiller, setOpenConseiller] = useState(false);
  const [openParrain1, setOpenParrain1] = useState(false);
  const [openParrain2, setOpenParrain2] = useState(false);
  const [openParrain3, setOpenParrain3] = useState(false);

  // Récupérer les conseillers depuis la BDD
  useEffect(() => {
    const fetchConseillers = async () => {
      const data = await getConseillersBDD();
      setLocalConseillers(data || []);
    };

    fetchConseillers();
  }, []);

  // Synchroniser les champs lorsque `selectedConseiller` change
  useEffect(() => {
    if (selectedConseiller) {
      const { typecontrat, chiffre_affaires, tva, auto_parrain } =
        selectedConseiller;

      console.log(selectedConseiller);

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

      if (selectedConseiller?.id) {
        // Récupérer le parrain de niveau 1
        getParrainLevel(selectedConseiller.id, 1)
          .then(({ id, nom }) => {
            setSelectedParrain(nom);
            setSelectedParrainId(id);
          })
          .catch((error) => {
            console.error(
              "Erreur lors de la récupération du parrain de niveau 1 :",
              error
            );
            setSelectedParrain("Aucun");
            setSelectedParrainId(null);
          });

        // Récupérer le parrain de niveau 2
        getParrainLevel(selectedConseiller.id, 2)
          .then(({ id, nom }) => {
            setSelectedParrain2(nom);
            setSelectedParrain2Id(id);
          })
          .catch((error) => {
            console.error(
              "Erreur lors de la récupération du parrain de niveau 2 :",
              error
            );
            setSelectedParrain2("Aucun");
            setSelectedParrain2Id(null);
          });

        // Récupérer le parrain de niveau 3
        getParrainLevel(selectedConseiller.id, 3)
          .then(({ id, nom }) => {
            setSelectedParrain3(nom);
            setSelectedParrain3Id(id);
          })
          .catch((error) => {
            console.error(
              "Erreur lors de la récupération du parrain de niveau 3 :",
              error
            );
            setSelectedParrain3("Aucun");
            setSelectedParrain3Id(null);
          });
      } else {
        // Réinitialiser les valeurs si aucun conseiller n'est sélectionné
        setSelectedParrain2("Aucun");
        setSelectedParrain2Id(null);
        setSelectedParrain3("Aucun");
        setSelectedParrain3Id(null);
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
  const conseillersNoms: SelectItem[] = (localConseillers || [])
    .map((conseiller) => ({
      key: conseiller.id,
      name: `${conseiller.prenom.trim()} ${conseiller.nom.trim()}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Exclure le conseiller sélectionné de la liste des parrains et classer par ordre alphabétique
  const parrains: SelectItem[] = (localConseillers || [])
    .filter((c) => c.id !== selectedConseiller?.id)
    .map((c) => ({
      key: c.id!,
      name: `${c.prenom.trim()} ${c.nom.trim()}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Gérer la sélection du parrain
  const handleSelectParrain = async (val: string) => {
    setSelectedParrain(val);
    const parrain = localConseillers.find(
      (c) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );
    setSelectedParrainId(parrain?.id || null);
  };

  // Gérer la sélection du conseiller
  const handleSelectConseiller = async (val: string) => {
    const conseiller = localConseillers.find(
      (c) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );
    setSelectedConseiller(conseiller || null);
  };

  // Gérer la sélection du parrain niveau 2
  const handleSelectParrain2 = async (val: string) => {
    setSelectedParrain2(val);
    const parrain = localConseillers.find(
      (c) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );
    setSelectedParrain2Id(parrain?.id || null);
  };

  // Gérer la sélection du parrain niveau 3
  const handleSelectParrain3 = async (val: string) => {
    setSelectedParrain3(val);
    const parrain = localConseillers.find(
      (c) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );
    setSelectedParrain3Id(parrain?.id || null);
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

      // Créer ou mettre à jour les parrainages
      if (selectedConseiller?.id) {
        const parrainageData = {
          user_id: selectedConseiller.id,
          niveau1: selectedParrainId,
          niveau2: selectedParrain2Id,
          niveau3: selectedParrain3Id,
        };

        // Gérer les parrainages pour tous les niveaux
        await handleParrainages(parrainageData);
      }

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
      <div className="flex flex-col space-y-2">
        <Label>Sélectionner un conseiller</Label>
        <PopoverCustom
          open={openConseiller}
          onOpenChange={setOpenConseiller}
          options={conseillersNoms}
          value={
            selectedConseiller
              ? `${selectedConseiller.prenom.trim()} ${selectedConseiller.nom.trim()}`
              : ""
          }
          onSelect={handleSelectConseiller}
          placeholder="Sélectionner un conseiller..."
          searchPlaceholder="Rechercher un conseiller..."
          emptyMessage="Aucun conseiller trouvé."
          selectedId={selectedConseiller?.id}
        />
      </div>
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
            disable={true}
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
            disable={true}
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
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-bold">
            Sélectionner les parrains du conseiller
          </h2>
          <div className="flex flex-row items-end space-x-4">
            <div className="flex flex-col space-y-2">
              <Label>Parrain niveau 1</Label>
              <PopoverCustom
                open={openParrain1}
                onOpenChange={setOpenParrain1}
                options={parrains}
                value={selectedParrain}
                onSelect={handleSelectParrain}
                placeholder="Sélectionner un parrain..."
                searchPlaceholder="Rechercher un parrain..."
                emptyMessage="Aucun parrain trouvé."
                selectedId={selectedParrainId}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label>Parrain niveau 2</Label>
              <PopoverCustom
                open={openParrain2}
                onOpenChange={setOpenParrain2}
                options={parrains}
                value={selectedParrain2}
                onSelect={handleSelectParrain2}
                placeholder="Sélectionner un parrain..."
                searchPlaceholder="Rechercher un parrain..."
                emptyMessage="Aucun parrain trouvé."
                selectedId={selectedParrain2Id}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label>Parrain niveau 3</Label>
              <PopoverCustom
                open={openParrain3}
                onOpenChange={setOpenParrain3}
                options={parrains}
                value={selectedParrain3}
                onSelect={handleSelectParrain3}
                placeholder="Sélectionner un parrain..."
                searchPlaceholder="Rechercher un parrain..."
                emptyMessage="Aucun parrain trouvé."
                selectedId={selectedParrain3Id}
              />
            </div>
          </div>
        </div>
      </div>
      {successMessage && <p className="text-green-600">{successMessage}</p>}
      <Button className="bg-orange-strong cursor-pointer" type="submit">
        Valider
      </Button>
    </form>
  );
}
