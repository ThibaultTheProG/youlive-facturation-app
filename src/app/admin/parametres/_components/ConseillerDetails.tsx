import React from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Conseiller } from "@/lib/types";

interface ConseillerDetailsProps {
  selectedConseiller: Conseiller | null;
  adresse: string;
  setAdresse: (adresse: string) => void;
  autreAdresse: string;
  setAutreAdresse: (autreAdresse: string) => void;
}

export default function ConseillerDetails({ selectedConseiller, adresse, setAdresse, autreAdresse, setAutreAdresse }: ConseillerDetailsProps) {
  return (
    <div className="flex flex-col space-y-4">
      {/* Ligne 1 : nom, prénom, id */}
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
      {/* Ligne 2 : email, téléphone, mobile */}
      <div className="flex flex-row justify-start space-x-4">
        <InputCustom
          disable={true}
          name="email"
          label="Email"
          id="email"
          type="email"
          value={selectedConseiller?.email || ""}
        />
        {selectedConseiller?.telephone && (
          <InputCustom
            disable={true}
            name="telephone"
            label="Téléphone"
            id="telephone"
            type="tel"
            value={selectedConseiller?.telephone || ""}
          />
        )}
        {selectedConseiller?.mobile && (
          <InputCustom
            disable={true}
            name="mobile"
            label="Mobile"
            id="mobile"
            type="tel"
            value={selectedConseiller?.mobile || ""}
          />
        )}
      </div>
      {/* Ligne 3 : adresse */}
      <div className="flex flex-row justify-start space-x-4">
        <InputCustom
          disable={false}
          name="adresse"
          label="Adresse"
          id="adresse"
          type="text"
          value={adresse}
          onChange={(val) => setAdresse(val as string)}
        />
        <InputCustom
          disable={false}
          name="autre_adresse"
          label="Autre adresse"
          id="autre_adresse"
          type="text"
          value={autreAdresse}
          onChange={(val) => setAutreAdresse(val as string)}
        />
      </div>
    </div>
  );
} 