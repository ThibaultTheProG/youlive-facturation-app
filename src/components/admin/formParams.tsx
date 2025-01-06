"use client";

import { useEffect, useState } from "react";
import InputCustom from "@/components/admin/inputCustom";
import SelectCustom from "@/components/admin/selectCustom";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/admin/radioCustom";
import { Button } from "@/components/ui/button";

import { updateConseillersBDD } from "@/backend/gestionConseillers";
import { calculRetrocession } from "@/utils/calculs";

type Conseiller = {
  prenom: string;
  nom: string;
  id: number;
  email?: string;
  telephone?: string;
  adresse?: string;
  idapimo?: string;
  tva?: boolean;
  typecontrat?: string;
  siren?: number;
  chiffre_affaires?: number;
  //retrocession?: number;
};

type SelectItem = {
  key: number;
  name: string;
};

interface FormParamsProps {
  conseillers: Conseiller[];
}

export default function FormParams({ conseillers }: FormParamsProps) {
  const [selectedParrain, setSelectedParrain] = useState("");
  const [assujettiTVA, setAssujettiTVA] = useState("");

  const [selectedConseiller, setSelectedConseiller] =
    useState<Conseiller | null>(null);
  const [selectedTypeContrat, setSelectedTypeContrat] = useState<
    string | undefined
  >(undefined);
  const [chiffreAffaires, setChiffreAffaires] = useState<number | undefined>(0);

  const conseillersNoms: SelectItem[] = [];

  conseillers.forEach((conseiller) => {
    if (conseiller.prenom && conseiller.nom) {
      conseillersNoms.push({
        key: conseiller.id,
        name: `${conseiller.prenom} ${conseiller.nom}`,
      });
    }
  });

  const handleSelectConseiller = (val: string) => {
    const conseiller = conseillers.find((c) => `${c.prenom} ${c.nom}` === val);
    console.log("Conseiller sélectionné :", conseiller);
    setSelectedConseiller(conseiller || null);
  };

  useEffect(() => {
    if (selectedConseiller) {
      console.log("Conseiller mis à jour :", selectedConseiller);
      console.log(
        "Type de contrat mis à jour :",
        selectedConseiller.typecontrat
      );
      setSelectedTypeContrat(selectedConseiller.typecontrat || undefined);
    }
  }, [selectedConseiller]);

  let retrocession = 0;

  if (chiffreAffaires !== undefined && selectedTypeContrat) {
    retrocession = calculRetrocession(selectedTypeContrat, chiffreAffaires);
  } else {
    console.warn(
      "Calcul impossible : Chiffre d'affaires ou Type contrat manquant",
      {
        chiffre_affaires: selectedConseiller?.chiffre_affaires,
        selectedTypeContrat,
      }
    );
  }

  console.log(
    "CA :",
    selectedConseiller?.chiffre_affaires,
    "Type contrat :",
    selectedTypeContrat,
    "Retrocession :",
    retrocession
  );

  return (
    <form action={updateConseillersBDD} className="space-y-4">
      <SelectCustom
        placeholder="Sélectionner un conseiller"
        selectLabel="Conseillers"
        value={conseillersNoms}
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
            placeholder={selectedConseiller?.nom || ""}
            defaultValue={selectedConseiller?.nom}
          />
          <InputCustom
            disable={true}
            name="prenom"
            label="Prénom"
            id="prenom"
            type="text"
            placeholder={selectedConseiller?.prenom || ""}
            defaultValue={selectedConseiller?.prenom}
          />
          <InputCustom
            disable={true}
            name="id_apimo"
            label="ID Apimo"
            id="id_apimo"
            type="number"
            placeholder={selectedConseiller?.idapimo || ""}
            defaultValue={selectedConseiller?.idapimo}
          />
        </div>
        <div className="flex flex-row justify-start space-x-4">
          <InputCustom
            disable={true}
            name="email"
            label="Email"
            id="email"
            type="email"
            placeholder={selectedConseiller?.email || ""}
            defaultValue={selectedConseiller?.email}
          />
          <InputCustom
            disable={true}
            name="telephone"
            label="Téléphone"
            id="telephone"
            type="tel"
            placeholder={selectedConseiller?.telephone || ""}
            defaultValue={selectedConseiller?.telephone}
          />
          <InputCustom
            disable={false}
            name="localisation"
            label="Localisation / Adresse"
            id="localisation"
            type="text"
            placeholder={selectedConseiller?.adresse || ""}
            defaultValue={selectedConseiller?.adresse}
          />
        </div>
        <div className="flex flex-row justify-between space-x-4">
          <InputCustom
            disable={false}
            name="siren"
            label="SIREN"
            id="siren"
            type="number"
            placeholder="Renseigner le SIREN"
            defaultValue={selectedConseiller?.siren}
          />
          <div className="flex flex-col justify-start space-y-2">
            <Label>Assujéti à la TVA</Label>
            <RadioCustom
              onChange={(value) => setAssujettiTVA(value)}
              defaultValue={selectedConseiller?.tva}
              name="assujetti_tva"
            />
          </div>
          <div className="flex flex-col justify-start space-y-2">
            <Label>Type de contrat</Label>
            <SelectCustom
              placeholder="Sélectionner un type de contrat"
              selectLabel="Type de contrat"
              defaultValue={selectedConseiller?.typecontrat}
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
            placeholder="Renseigner le CA ici"
            onChange={(val) =>
              setChiffreAffaires(typeof val === "string" ? Number(val) : val)
            }
            defaultValue={selectedConseiller?.chiffre_affaires}
          />
          <InputCustom
            disable={true}
            name="retrocession"
            label="% de rétrocession"
            id="retrocession"
            type="number"
            placeholder="% de rétrocession"
            defaultValue={retrocession}
          />
        </div>
        <div className="flex flex-row justify-between space-x-4">
          <div className="flex flex-col justify-start space-y-2">
            <Label>Selectionner un parrain</Label>
            <SelectCustom
              placeholder="Sélectionner un parrain"
              selectLabel="Parrains"
              value={conseillersNoms}
              name="parrain"
              onChange={(val) => setSelectedParrain(val)}
            />
          </div>
          <div className="flex flex-row justify-between space-x-2">
            <InputCustom
              disable={true}
              label="Parrain de niveau 1"
              id="parrain1"
              type="text"
              placeholder="Michel TOURNIQUET"
            />
            <InputCustom
              disable={true}
              label="Parrain de niveau 2"
              id="parrain2"
              type="text"
              placeholder="Aucun"
            />
            <InputCustom
              disable={true}
              label="Parrain de niveau 3"
              id="parrain3"
              type="text"
              placeholder="Aucun"
            />
          </div>
        </div>
        <div className="flex flex-row justify-strat space-x-4">
          <Button type="submit">Valider</Button>
        </div>
      </div>
    </form>
  );
}
