"use client";

import { useEffect, useMemo, useState } from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/uiCustom/radioCustom";
import { Button } from "@/components/ui/button";
import { Conseiller, User } from "@/lib/types";
import { toast } from "react-hot-toast";
import { calculRetrocession } from "@/utils/calculs";
import { BriefcaseBusiness, Building2, Receipt, UserRound } from "lucide-react";
import { Panneau } from "@/components/uiCustom/carteOnglets";

const EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const GRILLE = "grid gap-4 lg:grid-cols-2 2xl:grid-cols-3";

export default function FormParams({
  user,
  onglet,
}: {
  user: User;
  onglet: string;
}) {
  const [conseiller, setConseiller] = useState<Conseiller | null>(null);
  const [assujettiTVA, setAssujettiTVA] = useState<string>("non");
  const [autoParrain, setAutoParrain] = useState<string>("non");
  const [selectedTypeContrat, setSelectedTypeContrat] = useState<string>("");
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tauxTVA, setTauxTVA] = useState<number>(20);
  const [tvaRecrutement, setTvaRecrutement] = useState<string>("oui");

  // Nouveaux états pour les informations de facture de recrutement
  const [nomSocieteFacture, setNomSocieteFacture] = useState<string>("");
  const [sirenFacture, setSirenFacture] = useState<string>("");
  const [adresseFacture, setAdresseFacture] = useState<string>("");
  const [emailFacture, setEmailFacture] = useState<string>("");

  // États pour la gestion des années
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
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
        const url =
          selectedYear === currentYear
            ? `/api/conseiller?id=${user.id}`
            : `/api/conseiller?id=${user.id}&annee=${selectedYear}`;

        const response = await fetch(url);

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
          // Initialiser les nouveaux champs
          setNomSocieteFacture(data.nom_societe_facture || "");
          setSirenFacture(data.siren_facture || "");
          setAdresseFacture(data.adresse_facture || "");
          setEmailFacture(data.email_facture || "");
          setTauxTVA(data.taux_tva ?? 20);
          setTvaRecrutement(data.tva_recrutement === false ? "non" : "oui");
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

  // La rétrocession est entièrement dérivée du CA, du type de contrat et de
  // l'auto-parrainage : calculée au rendu plutôt que stockée dans un état.
  const retrocession = useMemo(
    () =>
      chiffreAffaires >= 0 && selectedTypeContrat
        ? calculRetrocession(selectedTypeContrat, chiffreAffaires, autoParrain)
        : 0,
    [chiffreAffaires, selectedTypeContrat, autoParrain],
  );

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
        adresse:
          formData.get("localisation")?.toString() ||
          conseiller?.adresse ||
          null,

        siren: conseiller?.siren || null,
        tva: formData.get("tva") === "oui",
        typecontrat: formData.get("type_contrat")?.toString() || null,
        chiffre_affaires: chiffreAffaires,
        retrocession: retrocession,
        auto_parrain: formData.get("auto_parrain")?.toString() || "non",

        // Nouvelles données pour les informations de facture de recrutement
        nom_societe_facture:
          formData.get("nom_societe_facture")?.toString() ||
          nomSocieteFacture ||
          null,
        siren_facture:
          formData.get("siren_facture")?.toString() || sirenFacture || null,
        adresse_facture:
          formData.get("adresse_facture")?.toString() || adresseFacture || null,
        email_facture: emailFacture.trim() || null,
        taux_tva: formData.get("tva") === "oui" ? tauxTVA : null,
        tva_recrutement: tvaRecrutement === "oui",
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
        throw new Error(
          "Erreur lors de la récupération des données mises à jour",
        );
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
    <form action={handleSubmit} hidden={onglet === "securite"}>
      <Panneau
        id="identite"
        actif={onglet}
        icon={UserRound}
        titre="Identité"
        description="Vos coordonnées, telles que synchronisées depuis Apimo. Seule l'adresse est modifiable ici."
        aside={
          conseiller?.idapimo ? (
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
              Apimo #{conseiller.idapimo}
            </span>
          ) : null
        }
      >
        <div className={GRILLE}>
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
            name="email"
            label="Email"
            id="email"
            type="email"
            value={conseiller?.email ?? ""}
          />
          {conseiller?.telephone ? (
            <InputCustom
              disable={true}
              name="telephone"
              label="Téléphone"
              id="telephone"
              type="tel"
              value={conseiller.telephone}
            />
          ) : conseiller?.mobile ? (
            <InputCustom
              disable={true}
              name="mobile"
              label="Mobile"
              id="mobile"
              type="tel"
              value={conseiller.mobile}
            />
          ) : null}
          <div className="lg:col-span-2">
            <InputCustom
              disable={false}
              name="localisation"
              label="Adresse"
              id="localisation"
              value={conseiller?.adresse ?? ""}
              onChange={(val) =>
                setConseiller((prev) =>
                  prev ? { ...prev, adresse: String(val) } : prev,
                )
              }
            />
          </div>
        </div>
      </Panneau>

      <Panneau
        id="contrat"
        actif={onglet}
        icon={BriefcaseBusiness}
        titre="Contrat & chiffre d'affaires"
        description="Votre contrat et vos honoraires de l'année. Ces valeurs sont calculées, vous ne les modifiez pas."
        aside={
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Label htmlFor="year_selector" className="text-xs text-gray-500">
              Année consultée
            </Label>
            <select
              id="year_selector"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                  {year === new Date().getFullYear() ? " (en cours)" : ""}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Honoraires HT ({selectedYear})
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 xl:text-3xl">
              {EUROS.format(chiffreAffaires)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Rétrocession
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[#b35a10] xl:text-3xl">
              {retrocession} %
            </p>
          </div>
        </div>
        <div className={GRILLE}>
          <InputCustom
            disable={true}
            name="type_contrat"
            label="Type de contrat"
            id="type_contrat"
            type="text"
            value={selectedTypeContrat}
          />
          <InputCustom
            disable={true}
            name="siren"
            label="SIREN / RSAC / RCS"
            id="siren"
            type="text"
            value={conseiller?.siren ?? ""}
          />
        </div>
      </Panneau>

      <Panneau
        id="fiscalite"
        actif={onglet}
        icon={Receipt}
        titre="Fiscalité"
        description="Détermine la TVA portée par vos factures."
      >
        <div className="flex flex-wrap items-start gap-x-12 gap-y-6">
          <div className="flex flex-col space-y-2">
            <Label className="text-sm text-gray-700">Assujetti à la TVA</Label>
            <RadioCustom
              onChange={(value) => setAssujettiTVA(value)}
              value={assujettiTVA}
              name="tva"
            />
          </div>
          {assujettiTVA === "oui" && (
            <InputCustom
              disable={false}
              name="taux_tva"
              label="Taux de TVA (%)"
              id="taux_tva"
              type="number"
              value={tauxTVA}
              onChange={(val) => setTauxTVA(Number(val))}
            />
          )}
          {assujettiTVA === "oui" && (
            <div className="flex flex-col space-y-2">
              <Label className="text-sm text-gray-700">
                TVA sur les factures de recrutement
              </Label>
              <RadioCustom
                onChange={(value) => setTvaRecrutement(value)}
                value={tvaRecrutement}
                name="tva_recrutement"
              />
            </div>
          )}
        </div>
      </Panneau>

      <Panneau
        id="recrutement"
        actif={onglet}
        icon={Building2}
        titre="Facturation recrutement"
        description="À compléter uniquement si votre société qui facture les recrutements diffère des informations de l'onglet Identité."
      >
        <div className={GRILLE}>
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
          <InputCustom
            disable={false}
            name="email_facture"
            label="Email de facturation"
            id="email_facture"
            type="email"
            value={emailFacture}
            onChange={(val) => setEmailFacture(String(val))}
          />
          <div className="lg:col-span-2 2xl:col-span-3">
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
      </Panneau>

      <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between gap-4 border-t border-gray-100 bg-white/90 px-5 py-4 backdrop-blur md:-mx-8 md:px-8">
        <p role="status" className="text-sm text-green-600">
          {successMessage}
        </p>
        <Button
          className="bg-orange-strong cursor-pointer"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
