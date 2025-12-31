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

  // Nouveaux états pour les informations de facture de recrutement
  const [nomSocieteFacture, setNomSocieteFacture] = useState<string>("");
  const [sirenFacture, setSirenFacture] = useState<string>("");
  const [adresseFacture, setAdresseFacture] = useState<string>("");

  // États pour la gestion des années
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Récupérer les années disponibles
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch(`/api/conseiller/annees?id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableYears(data.annees || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des années:", error);
      }
    };

    if (user?.id) {
      fetchYears();
    }
  }, [user?.id]);

  // Récupérer les informations du conseiller (avec l'année sélectionnée)
  useEffect(() => {
    const fetchConseillers = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const url = selectedYear === currentYear
          ? `/api/conseiller?id=${user.id}`
          : `/api/conseiller?id=${user.id}&annee=${selectedYear}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération du conseiller")
        }

        const data = await response.json();
        setConseiller(data);

        if (data) {
          setAssujettiTVA(data.tva ? "oui" : "non");
          setAutoParrain(data.auto_parrain || "non");
          setSelectedTypeContrat(data.typecontrat || "");
          setChiffreAffaires(data.chiffre_affaires || 0);
          // Initialiser les nouveaux champs
          setNomSocieteFacture(data.nom_societe_facture || "");
          setSirenFacture(data.siren_facture || "");
          setAdresseFacture(data.adresse_facture || "");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du conseiller:", error);
        toast.error("Impossible de récupérer les informations du conseiller");
      }
    };

    if (user?.id) {
      fetchConseillers();
    }
  }, [user?.id, selectedYear]);

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
        
        // Nouvelles données pour les informations de facture de recrutement
        nom_societe_facture: formData.get("nom_societe_facture")?.toString() || nomSocieteFacture || null,
        siren_facture: formData.get("siren_facture")?.toString() || sirenFacture || null,
        adresse_facture: formData.get("adresse_facture")?.toString() || adresseFacture || null,
      };
      
      //console.log("Données envoyées à l'API:", conseillerData);
      
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
    <form action={handleSubmit} className="space-y-6">
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
            disable={true}
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

          {/* Sélecteur d'année */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="year_selector">Consulter l'année</Label>
            <select
              id="year_selector"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2 bg-white"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year} {year === new Date().getFullYear() && "(Année en cours)"}
                </option>
              ))}
            </select>
          </div>

          <InputCustom
            disable={true}
            name="chiffre_affaire_annuel"
            label={`Honoraires Youlive HT générés (${selectedYear})`}
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
        {/* <div className="flex flex-col justify-start space-y-2">
          <Label>Auto parrain</Label>
          <RadioCustom
            onChange={(value) => setAutoParrain(value)}
            value={autoParrain}
            name="auto_parrain"
          />
        </div> */}
      </div>

      {/* Section Informations facture de recrutement */}
      <div className="border-t pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Informations facture de recrutement
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            À compléter uniquement si les informations sont différentes des informations déjà renseignées ci-dessus.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row justify-start space-x-4">
            <InputCustom
              disable={false}
              name="nom_societe_facture"
              label="Nom de société"
              id="nom_societe_facture"
              type="text"
              value={nomSocieteFacture}
              onChange={(val) => setNomSocieteFacture(String(val))}
            />
            <InputCustom
              disable={false}
              name="siren_facture"
              label="SIREN / RSAC / RCS"
              id="siren_facture"
              type="text"
              value={sirenFacture}
              onChange={(val) => setSirenFacture(String(val))}
            />
          </div>
          <div className="flex flex-row justify-start space-x-4">
            <InputCustom
              disable={false}
              name="adresse_facture"
              label="Adresse de facturation"
              id="adresse_facture"
              type="text"
              value={adresseFacture}
              onChange={(val) => setAdresseFacture(String(val))}
            />
          </div>
        </div>
      </div>

      {successMessage && <p className="text-green-600">{successMessage}</p>}
      <Button className="bg-orange-strong cursor-pointer" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Chargement..." : "Valider"}
      </Button>
    </form>
  );
}
