"use client";

import { FormEvent, useState } from "react";
import InputCustom from "@/components/admin/inputCustom";
import SelectCustom from "@/components/admin/selectConseiller";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/admin/radioCustom";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

type Conseiller = {
  prenom: string;
  nom: string;
  id: number;
  email?: string;
  telephone?: string;
  adresse?: string;
  idapimo?: string;
  tva?: boolean;
};

type SelectItem = {
  key: number;
  name: string;
};

interface FormParamsProps {
  conseillers: Conseiller[];
}

export default function FormParams({ conseillers }: FormParamsProps) {
  const [selectedConseiller, setSelectedConseiller] = useState<Conseiller | null>(null);
  const [selectedTypeContrat, setSelectedTypeContrat] = useState("");
  const [selectedParrain, setSelectedParrain] = useState("");
  const [assujettiTVA, setAssujettiTVA] = useState("");

  const conseillersNoms: SelectItem[] = [];
  const typeContrat: string[] = ["Offre Youlive", "Offre découverte"];

  conseillers.forEach((conseiller) => {
    if (conseiller.prenom && conseiller.nom) {
      conseillersNoms.push({
        key: conseiller.id,
        name: `${conseiller.prenom} ${conseiller.nom}`,
      });
    }
  });

  // Fonction appelée lors de la soumission du formulaire
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Ici, vous pouvez implémenter votre logique (API call, etc.)
    // par exemple console.log ou fetch vers votre backend
    console.log("Formulaire soumis !");
    console.log({
      conseiller: selectedConseiller,
      typeContrat: selectedTypeContrat,
      parrain: selectedParrain,
      assujettiTVA: assujettiTVA,
      // ...
    });
    redirect("/"); // Redirige l'utilisateur vers la page d'accueil
  };

  console.log(selectedConseiller);

  const handleSelectConseiller = (val: string) => {
    const conseiller = conseillers.find(
      (c) => `${c.prenom} ${c.nom}` === val
    );
    setSelectedConseiller(conseiller || null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            label="Nom"
            id="nom"
            type="text"
            placeholder={selectedConseiller?.nom || ""}
          />
          <InputCustom
            disable={true}
            label="Prénom"
            id="prenom"
            type="text"
            placeholder={selectedConseiller?.prenom || ""}
          />
          <InputCustom
            disable={true}
            label="ID Apimo"
            id="id_apimo"
            type="number"
            placeholder={selectedConseiller?.idapimo || ""}
          />
        </div>
        <div className="flex flex-row justify-start space-x-4">
          <InputCustom
            disable={true}
            label="Email"
            id="email"
            type="email"
            placeholder={selectedConseiller?.email || ""}
          />
          <InputCustom
            disable={true}
            label="Téléphone"
            id="telephone"
            type="tel"
            placeholder={selectedConseiller?.telephone || ""}
          />
          <InputCustom
            disable={false}
            label="Localisation / Adresse"
            id="localisation"
            type="text"
            placeholder={selectedConseiller?.adresse || ""}
          />
        </div>
        <div className="flex flex-row justify-between space-x-4">
          <InputCustom
            disable={false}
            label="SIREN"
            id="siren"
            type="number"
            placeholder="492938213193192"
          />
          <div className="flex flex-col justify-start space-y-2">
            <Label>Assujéti à la TVA</Label>
            <RadioCustom
              value={assujettiTVA}
              onChange={(value) => setAssujettiTVA(value)}
              defaultValue={selectedConseiller?.tva}
            />
          </div>
          <div className="flex flex-col justify-start space-y-2">
            <Label>Type de contrat</Label>
            <SelectCustom
              placeholder="Sélectionner un type de contrat"
              selectLabel="Type de contrat"
              value={typeContrat}
              onChange={(val) => setSelectedTypeContrat(val)}
            />
          </div>
        </div>
        <div className="flex flex-row justify-between  space-x-4">
          <InputCustom
            disable={false}
            label="Chiffre d'affaire annuel"
            id="chiffre_affaire_annuel"
            type="number"
            placeholder="49 000 €"
          />
          <InputCustom
            disable={true}
            label="% de rétrocession"
            id="retrocession"
            type="number"
            placeholder="99%"
          />
        </div>
        <div className="flex flex-row justify-between space-x-4">
          <div className="flex flex-col justify-start space-y-2">
            <Label>Selectionner un parrain</Label>
            <SelectCustom
              placeholder="Sélectionner un parrain"
              selectLabel="Parrains"
              value={conseillersNoms}
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
