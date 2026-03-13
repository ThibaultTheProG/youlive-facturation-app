import React from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Conseiller } from "@/lib/types";
import { User } from "lucide-react";

interface ConseillerDetailsProps {
  selectedConseiller: Conseiller | null;
  adresse: string;
  setAdresse: (adresse: string) => void;
}

export default function ConseillerDetails({ selectedConseiller, adresse, setAdresse }: ConseillerDetailsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fef3e8" }}>
          <User className="w-3.5 h-3.5" style={{ color: "#E07C24" }} />
        </div>
        <span className="text-sm font-semibold text-gray-700">Identité du conseiller</span>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ID #{selectedConseiller?.id}</span>
      </div>

      <div className="p-6 space-y-4">
        {/* Nom / Prénom */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Email + Téléphone */}
        <div className="grid grid-cols-2 gap-4">
          <InputCustom
            disable={true}
            name="email"
            label="Email"
            id="email"
            type="email"
            value={selectedConseiller?.email || ""}
          />
          {selectedConseiller?.telephone ? (
            <InputCustom
              disable={true}
              name="telephone"
              label="Téléphone"
              id="telephone"
              type="tel"
              value={selectedConseiller.telephone}
            />
          ) : selectedConseiller?.mobile ? (
            <InputCustom
              disable={true}
              name="mobile"
              label="Mobile"
              id="mobile"
              type="tel"
              value={selectedConseiller.mobile}
            />
          ) : null}
        </div>

        {/* Adresse (éditable) */}
        <div>
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
    </div>
  );
}
