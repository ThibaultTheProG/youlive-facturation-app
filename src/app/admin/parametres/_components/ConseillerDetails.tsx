import React from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Conseiller } from "@/lib/types";

interface ConseillerDetailsProps {
  selectedConseiller: Conseiller | null;
  adresse: string;
  setAdresse: (adresse: string) => void;
}

export default function ConseillerDetails({ selectedConseiller, adresse, setAdresse }: ConseillerDetailsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      <InputCustom disable={true} name="nom" label="Nom" id="nom" type="text" value={selectedConseiller?.nom || ""} />
      <InputCustom disable={true} name="prenom" label="Prénom" id="prenom" type="text" value={selectedConseiller?.prenom || ""} />
      <InputCustom disable={true} name="email" label="Email" id="email" type="email" value={selectedConseiller?.email || ""} />
      {selectedConseiller?.telephone ? (
        <InputCustom disable={true} name="telephone" label="Téléphone" id="telephone" type="tel" value={selectedConseiller.telephone} />
      ) : selectedConseiller?.mobile ? (
        <InputCustom disable={true} name="mobile" label="Mobile" id="mobile" type="tel" value={selectedConseiller.mobile} />
      ) : null}
      {/* Identifiant légal : appartient à Apimo, écrasé chaque nuit par la sync */}
      <InputCustom
        disable={true}
        name="siren_apimo"
        label="SIREN / RSAC / RCS (Apimo)"
        id="siren_apimo"
        type="text"
        value={selectedConseiller?.siren || ""}
      />
      <div className="lg:col-span-2">
        <InputCustom
          disable={false}
          name="adresse"
          label="Adresse"
          id="adresse"
          type="text"
          value={adresse}
          onChange={(val) => setAdresse(val as string)}
        />
      </div>
    </div>
  );
}
