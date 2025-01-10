"use client";

import { useEffect, useState } from "react";
import InputCustom from "@/components/admin/inputCustom";
import SelectCustom from "@/components/admin/selectCustom";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/admin/radioCustom";
import { Button } from "@/components/ui/button";
import { Conseiller, SelectItem } from "@/lib/types";
import {
  getConseillersBDD,
  updateConseillersBDD,
  //getParrainnageBDD,
  upsertParrainnageBDD,
  getParrains,
} from "@/backend/gestionConseillers";
import { calculRetrocession } from "@/utils/calculs";

export default function FormParams() {
  const [localConseillers, setLocalConseillers] = useState<Conseiller[]>([]);
  const [selectedParrain, setSelectedParrain] = useState("");
  const [assujettiTVA, setAssujettiTVA] = useState("non");
  const [selectedConseiller, setSelectedConseiller] =
    useState<Conseiller | null>(null);
  const [selectedTypeContrat, setSelectedTypeContrat] = useState<string>("");
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [retrocession, setRetrocession] = useState<number>(0);
  const [parrainNiveau2, setParrainNiveau2] = useState<string>("Aucun");
  const [parrainNiveau3, setParrainNiveau3] = useState<string>("Aucun");

  // Récupérer les conseillers depuis la BDD
  useEffect(() => {
    const fetchConseillers = async () => {
      const data = await getConseillersBDD(); // Remplacez par votre logique de récupération
      setLocalConseillers(data);
    };

    fetchConseillers();
  }, []);

  // Synchroniser les champs lorsque `selectedConseiller` change
  useEffect(() => {
    if (selectedConseiller) {
      setSelectedTypeContrat(selectedConseiller.typecontrat || "");
      setChiffreAffaires(selectedConseiller.chiffre_affaires || 0);
      setAssujettiTVA(selectedConseiller.tva ? "oui" : "non");
      setRetrocession(
        selectedConseiller.chiffre_affaires && selectedConseiller.typecontrat
          ? calculRetrocession(
              selectedConseiller.typecontrat,
              selectedConseiller.chiffre_affaires
            )
          : 0
      );
    } else {
      // Réinitialiser les valeurs si aucun conseiller sélectionné
      setSelectedTypeContrat("");
      setChiffreAffaires(0);
      setAssujettiTVA("non");
      setRetrocession(0);
    }
  }, [selectedConseiller]);

  // Calculer la rétrocession à chaque changement de chiffre d'affaires ou de type de contrat
  useEffect(() => {
    if (chiffreAffaires > 0 && selectedTypeContrat) {
      setRetrocession(calculRetrocession(selectedTypeContrat, chiffreAffaires));
    } else {
      setRetrocession(0); // Réinitialiser si une des conditions n'est pas remplie
    }
  }, [chiffreAffaires, selectedTypeContrat]);

  // Générer le tableau des conseillers
  const conseillersNoms: SelectItem[] = localConseillers.map((conseiller) => ({
    key: conseiller.id,
    name: `${conseiller.prenom} ${conseiller.nom}`,
  }));

  // Exclure le conseiller sélectionné de la liste des parrains
  const conseillersNomsSansSelf: { key: number; name: string }[] =
    localConseillers
      .filter((c) => c.idapimo !== selectedConseiller?.idapimo)
      .map((c) => ({
        key: c.idapimo!, // Assurez-vous que `idapimo` n'est pas `undefined`
        name: `${c.prenom} ${c.nom}`,
      }));

  // Gérer la sélection du conseiller
  const handleSelectConseiller = async (val: string) => {
    const conseiller = localConseillers.find(
      (c) => `${c.prenom} ${c.nom}` === val
    );
    setSelectedConseiller(conseiller || null);

    if (conseiller?.idapimo) {
      try {
        // Typage explicite de la fonction `getParrains`
        const parrains: { prenom: string; nom: string; niveau: number }[] =
          await getParrains(conseiller.idapimo);

        console.log("Parrains récupérés :", parrains);

        // Réinitialiser les valeurs des parrains
        setSelectedParrain("Aucun");
        setParrainNiveau2("Aucun");
        setParrainNiveau3("Aucun");

        parrains.forEach((parrain) => {
          if (parrain.niveau === 1) {
            setSelectedParrain(`${parrain.prenom} ${parrain.nom}`);
            console.log("Parrain de niveau 1 :", parrain);
          } else if (parrain.niveau === 2) {
            setParrainNiveau2(`${parrain.prenom} ${parrain.nom}`);
            console.log("Parrain de niveau 2 :", parrain);
          } else if (parrain.niveau === 3) {
            setParrainNiveau3(`${parrain.prenom} ${parrain.nom}`);
            console.log("Parrain de niveau 3 :", parrain);
          }
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des parrains :", error);
      }
    } else {
      console.log("Aucun conseiller sélectionné ou idApimo manquant.");
      setSelectedParrain("Aucun");
      setParrainNiveau2("Aucun");
      setParrainNiveau3("Aucun");
    }
  };

  // Recharger les conseillers après soumission
  const handleFormSubmit = async (formData: FormData) => {
    try {
      // Mise à jour des informations du conseiller dans la BDD
      await updateConseillersBDD(formData);

      const conseillerIdApimo = Number(formData.get("id_apimo"));
      const parrainNom = formData.get("parrain");

      if (conseillerIdApimo && parrainNom) {
        // Trouver le parrain sélectionné dans la liste des conseillers
        const parrain = localConseillers.find(
          (c) => `${c.prenom} ${c.nom}` === parrainNom
        );

        if (parrain) {
          // Mettre à jour ou insérer le parrain de niveau 1
          await upsertParrainnageBDD(
            conseillerIdApimo,
            parrain.idapimo as number,
            1
          );

          // Vérifier les niveaux de parrainage
          const parrains: Array<{
            prenom: string;
            nom: string;
            niveau: number;
            parrain_id: number;
          }> = await getParrains(conseillerIdApimo);

          // Gérer les mises à jour des niveaux 2 et 3 si nécessaire
          const parrainDeNiveau1 = parrains.find((p) => p.niveau === 1);

          if (parrainDeNiveau1) {
            const parrainDeNiveau2: Array<{
              prenom: string;
              nom: string;
              niveau: number;
              parrain_id: number;
            }> = await getParrains(parrainDeNiveau1.parrain_id);
            if (parrainDeNiveau2.length > 0) {
              const parrainDeNiveau2Info = parrainDeNiveau2.find(
                (p) => p.niveau === 1
              );

              if (parrainDeNiveau2Info) {
                // Insérer ou mettre à jour le parrain de niveau 2
                await upsertParrainnageBDD(
                  conseillerIdApimo,
                  parrainDeNiveau2Info.parrain_id,
                  2
                );

                // Vérifier s'il y a un niveau 3
                const parrainDeNiveau3: Array<{
                  prenom: string;
                  nom: string;
                  niveau: number;
                  parrain_id: number;
                }> = await getParrains(parrainDeNiveau2Info.parrain_id);

                if (parrainDeNiveau3.length > 0) {
                  const parrainDeNiveau3Info = parrainDeNiveau3.find(
                    (p) => p.niveau === 1
                  );

                  if (parrainDeNiveau3Info) {
                    // Insérer ou mettre à jour le parrain de niveau 3
                    await upsertParrainnageBDD(
                      conseillerIdApimo,
                      parrainDeNiveau3Info.parrain_id,
                      3
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Recharger les conseillers après mise à jour
      const updatedConseillers: Conseiller[] = await getConseillersBDD();
      setLocalConseillers(updatedConseillers);

      // Mettre à jour le conseiller sélectionné si existant
      const updatedConseiller = updatedConseillers.find(
        (c: Conseiller) => c.idapimo === Number(formData.get("id_apimo"))
      );
      setSelectedConseiller(updatedConseiller || null);

      // Mettre à jour les informations des parrains pour le conseiller sélectionné
      if (updatedConseiller && updatedConseiller.idapimo !== undefined) {
        const parrains: Array<{
          prenom: string;
          nom: string;
          niveau: number;
          parrain_id: number;
        }> = await getParrains(updatedConseiller.idapimo);

        parrains.forEach((parrain) => {
          if (parrain.niveau === 1) {
            setSelectedParrain(`${parrain.prenom} ${parrain.nom}`);
          } else if (parrain.niveau === 2) {
            setParrainNiveau2(`${parrain.prenom} ${parrain.nom}`);
          } else if (parrain.niveau === 3) {
            setParrainNiveau3(`${parrain.prenom} ${parrain.nom}`);
          }
        });
      }
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour ou du rechargement :",
        error
      );
    }
  };

  return (
    <form action={handleFormSubmit} className="space-y-4">
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
      <div className="flex flex-col space-y-4">
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
            name="id_apimo"
            label="ID Apimo"
            id="id_apimo"
            type="number"
            value={selectedConseiller?.idapimo || ""}
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
        <div className="flex flex-row justify-between space-x-4">
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
        <div className="flex flex-row justify-center items-end space-x-4">
          <SelectCustom
            placeholder="Sélectionner un parrain"
            selectLabel="Parrains"
            options={conseillersNomsSansSelf} // Exclut le conseiller lui-même
            value={selectedParrain}
            name="parrain"
            onChange={(val) => setSelectedParrain(val)}
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
      <Button type="submit">Valider</Button>
    </form>
  );
}
