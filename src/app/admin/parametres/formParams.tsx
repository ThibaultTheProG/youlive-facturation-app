"use client";

import { useEffect, useState, useMemo } from "react";
// import InputCustom from "@/components/uiCustom/inputCustom";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/uiCustom/radioCustom";
import { Conseiller } from "@/lib/types";
// import PopoverCustom from "@/components/uiCustom/popoverCustom";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import SubmitButton from "@/components/uiCustom/submitButton";
import FormStatusMessage, {
  FormStatusType,
} from "@/components/uiCustom/formStatusMessage";
import useConseillers from "@/hooks/useConseillers";
import { calculRetrocession } from "@/utils/calculs";
import ConseillerSelector from "./_components/ConseillerSelector";
import ConseillerDetails from "./_components/ConseillerDetails";
import ContratManager from "./_components/ContratManager";
import ParrainagesManager from "./_components/ParrainagesManager";

// Composant principal
export default function FormParams() {
  const router = useRouter();
  const { conseillers: localConseillers, isLoading: isLoadingConseillers } =
    useConseillers();

  // États
  const [selectedConseiller, setSelectedConseiller] =
    useState<Conseiller | null>(null);
  const [assujettiTVA, setAssujettiTVA] = useState<string>("non");
  const [autoParrain, setAutoParrain] = useState<string>("non");
  const [selectedTypeContrat, setSelectedTypeContrat] = useState<string>("");
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [retrocession, setRetrocession] = useState<number>(0);
  const [adresse, setAdresse] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatusType>({
    type: null,
    message: null,
  });

  // États pour les popovers
  const [openConseiller, setOpenConseiller] = useState(false);
  const [openParrain1, setOpenParrain1] = useState(false);
  const [openParrain2, setOpenParrain2] = useState(false);
  const [openParrain3, setOpenParrain3] = useState(false);

  // États pour les parrains
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

  // Ajout de l'état pour la gestion manuelle de la rétrocession
  const [isRetrocessionManuallySet, setIsRetrocessionManuallySet] = useState(false);

  // Synchroniser les champs lorsque selectedConseiller change
  useEffect(() => {
    if (selectedConseiller) {
      const { tva, auto_parrain, typecontrat, chiffre_affaires, adresse: conseillerAdresse } =
        selectedConseiller;

      setSelectedTypeContrat(typecontrat || "");
      setChiffreAffaires(chiffre_affaires || 0);
      setAssujettiTVA(tva ? "oui" : "non");
      setAdresse(conseillerAdresse || "");

      if (auto_parrain) {
        setAutoParrain(auto_parrain);
      }
    }
  }, [selectedConseiller]);

  // Calculer la rétrocession à chaque changement de chiffre d'affaires ou de type de contrat
  useEffect(() => {
    if (!isRetrocessionManuallySet) {
      if (selectedTypeContrat) {
        const calculatedRetrocession = calculRetrocession(
          selectedTypeContrat,
          chiffreAffaires,
          autoParrain
        );
        setRetrocession(calculatedRetrocession);
      } else {
        setRetrocession(0);
      }
    }
  }, [chiffreAffaires, selectedTypeContrat, autoParrain, isRetrocessionManuallySet]);

  // Remise à zéro du flag manuel lors du changement de conseiller
  useEffect(() => {
    setIsRetrocessionManuallySet(false);
  }, [selectedConseiller]);

  // Afficher un état de chargement pendant le chargement des conseillers
  useEffect(() => {
    if (isLoadingConseillers) {
      setFormStatus({
        type: "loading",
        message: "Chargement des conseillers...",
      });
    } else {
      setFormStatus({ type: null, message: null });
    }
  }, [isLoadingConseillers]);

  // Définir un type pour les éléments de la liste
  type SelectItemWithKey = {
    key: number;
    name: string;
  };

  // Données dérivées
  const conseillersNoms = useMemo(
    () =>
      (localConseillers || [])
        .map((conseiller: Conseiller) => ({
          key: conseiller.id,
          name: `${conseiller.prenom.trim()} ${conseiller.nom.trim()}`,
        }))
        .sort((a: SelectItemWithKey, b: SelectItemWithKey) =>
          a.name.localeCompare(b.name)
        ),
    [localConseillers]
  );

  const parrains = useMemo(() => {
    // Créer une option "Aucun" avec une clé spéciale
    const aucunOption = { key: -1, name: "Aucun" };

    // Filtrer et mapper les conseillers
    const parrainsList = (localConseillers || [])
      .filter((c: Conseiller) => c.id !== selectedConseiller?.id)
      .map((c: Conseiller) => ({
        key: c.id!,
        name: `${c.prenom.trim()} ${c.nom.trim()}`,
      }))
      .sort((a: SelectItemWithKey, b: SelectItemWithKey) =>
        a.name.localeCompare(b.name)
      );

    // Ajouter l'option "Aucun" au début de la liste
    return [aucunOption, ...parrainsList];
  }, [localConseillers, selectedConseiller]);

  // Gestionnaires d'événements
  const handleSelectConseiller = async (val: string) => {
    // Trouver le conseiller dans la liste locale pour obtenir son ID
    const conseiller = localConseillers.find(
      (c: Conseiller) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );

    if (conseiller) {
      try {
        setFormStatus({
          type: "loading",
          message: "Chargement des informations...",
        });

        // Récupérer les informations à jour du conseiller depuis la base de données
        const conseillerResponse = await fetch(`/api/conseiller?id=${conseiller.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!conseillerResponse.ok) {
          const errorData = await conseillerResponse.json();
          throw new Error(errorData.error || `Erreur HTTP: ${conseillerResponse.status}`);
        }

        // Mettre à jour le conseiller sélectionné avec les données fraîches de la BDD
        const conseillerData = await conseillerResponse.json();
        setSelectedConseiller(conseillerData);

        // Récupération de tous les parrains en une seule requête
        const parrainagesResponse = await fetch(
          `/api/conseillers/getParrainages?idConseiller=${conseiller.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        if (!parrainagesResponse.ok) {
          const errorData = await parrainagesResponse.json();
          throw new Error(errorData.error || `Erreur HTTP: ${parrainagesResponse.status}`);
        }

        const parrainages = await parrainagesResponse.json();

        // Mise à jour des états pour chaque niveau de parrain
        setSelectedParrain(parrainages.niveau1.nom);
        setSelectedParrainId(parrainages.niveau1.id);

        setSelectedParrain2(parrainages.niveau2.nom);
        setSelectedParrain2Id(parrainages.niveau2.id);

        setSelectedParrain3(parrainages.niveau3.nom);
        setSelectedParrain3Id(parrainages.niveau3.id);

        setFormStatus({ type: null, message: null });
      } catch (error) {
        console.error("Erreur lors de la récupération des informations:", error);
        setFormStatus({
          type: "error",
          message: `Erreur: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });

        // En cas d'erreur, utiliser les données locales comme fallback
        setSelectedConseiller(conseiller || null);
        
        // Réinitialiser les valeurs des parrains
        setSelectedParrain("Aucun");
        setSelectedParrainId(null);
        setSelectedParrain2("Aucun");
        setSelectedParrain2Id(null);
        setSelectedParrain3("Aucun");
        setSelectedParrain3Id(null);
      }
    } else {
      // Réinitialiser les valeurs si aucun conseiller n'est sélectionné
      setSelectedConseiller(null);
      setSelectedParrain("Aucun");
      setSelectedParrainId(null);
      setSelectedParrain2("Aucun");
      setSelectedParrain2Id(null);
      setSelectedParrain3("Aucun");
      setSelectedParrain3Id(null);
    }
  };

  const handleSelectParrain = async (val: string) => {
    setSelectedParrain(val);
    // Si "Aucun" est sélectionné, mettre l'ID à null
    if (val === "Aucun") {
      setSelectedParrainId(null);
      return;
    }
    const parrain = localConseillers.find(
      (c: Conseiller) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );
    setSelectedParrainId(parrain?.id || null);
  };

  const handleSelectParrain2 = async (val: string) => {
    setSelectedParrain2(val);
    // Si "Aucun" est sélectionné, mettre l'ID à null
    if (val === "Aucun") {
      setSelectedParrain2Id(null);
      return;
    }
    const parrain = localConseillers.find(
      (c: Conseiller) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );
    setSelectedParrain2Id(parrain?.id || null);
  };

  const handleSelectParrain3 = async (val: string) => {
    setSelectedParrain3(val);
    // Si "Aucun" est sélectionné, mettre l'ID à null
    if (val === "Aucun") {
      setSelectedParrain3Id(null);
      return;
    }
    const parrain = localConseillers.find(
      (c: Conseiller) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );
    setSelectedParrain3Id(parrain?.id || null);
  };

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setFormStatus({ type: null, message: null });

    try {
      // Vérifier que selectedConseiller existe
      if (!selectedConseiller || !selectedConseiller.id) {
        toast.error("Veuillez sélectionner un conseiller");
        setFormStatus({
          type: "error",
          message: "Veuillez sélectionner un conseiller",
        });
        setIsSubmitting(false);
        return;
      }

      // Préparation des données pour l'API
      const formDataObj = Object.fromEntries(formData.entries());

      // Création de l'objet de données à envoyer
      const conseillerData = {
        id: selectedConseiller.id,
        prenom: formDataObj.prenom as string,
        nom: formDataObj.nom as string,
        email: formDataObj.email as string,
        telephone: formDataObj.telephone as string,
        adresse: adresse,

        siren: formDataObj.siren as string,
        retrocession: Number(retrocession),
        tva: assujettiTVA === "oui",
        typecontrat: selectedTypeContrat,
        auto_parrain: autoParrain,
        chiffre_affaires: Number(chiffreAffaires),
        parrain_id: selectedParrainId,
        niveau2_id: selectedParrain2Id,
        niveau3_id: selectedParrain3Id,
      };

      console.log("Données envoyées à l'API:", conseillerData);

      // Appel à l'API
      const response = await fetch("/api/conseillers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conseillerData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la mise à jour");
      }

      // Rafraîchir les données du conseiller après la mise à jour
      try {
        const conseillerResponse = await fetch(`/api/conseiller?id=${selectedConseiller.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (conseillerResponse.ok) {
          const updatedConseillerData = await conseillerResponse.json();
          setSelectedConseiller(updatedConseillerData);
        }
      } catch (refreshError) {
        console.error("Erreur lors du rafraîchissement des données du conseiller:", refreshError);
        // Ne pas bloquer le flux principal en cas d'erreur de rafraîchissement
      }

      toast.success("Conseiller mis à jour avec succès");
      setFormStatus({
        type: "success",
        message: "Conseiller mis à jour avec succès",
      });
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du conseiller", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(
        `Erreur lors de la mise à jour du conseiller: ${errorMessage}`
      );
      setFormStatus({
        type: "error",
        message: `Erreur lors de la mise à jour du conseiller: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu
  return (
    <form action={handleFormSubmit} className="space-y-8">
      <ConseillerSelector
        conseillersNoms={conseillersNoms}
        selectedConseiller={selectedConseiller}
        openConseiller={openConseiller}
        setOpenConseiller={setOpenConseiller}
        handleSelectConseiller={handleSelectConseiller}
      />
      {selectedConseiller && (
        <>
          <ConseillerDetails
            selectedConseiller={selectedConseiller}
            adresse={adresse}
            setAdresse={setAdresse}
          />
          <div className="flex flex-row justify-start space-x-4">
            <div className="flex flex-col space-y-2">
              <Label>Assujetti à la TVA</Label>
              <RadioCustom
                onChange={(value) => setAssujettiTVA(value)}
                value={assujettiTVA}
                name="assujetti_tva"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Auto-parrainage</Label>
              <RadioCustom
                onChange={(value) => setAutoParrain(value)}
                value={autoParrain}
                name="auto_parrain"
              />
            </div>
          </div>
          <ContratManager
            selectedTypeContrat={selectedTypeContrat}
            setSelectedTypeContrat={setSelectedTypeContrat}
            chiffreAffaires={chiffreAffaires}
            setChiffreAffaires={setChiffreAffaires}
            retrocession={retrocession}
            setRetrocession={setRetrocession}
            setIsRetrocessionManuallySet={setIsRetrocessionManuallySet}
          />
          <ParrainagesManager
            parrains={parrains}
            openParrain1={openParrain1}
            setOpenParrain1={setOpenParrain1}
            selectedParrain={selectedParrain}
            handleSelectParrain={handleSelectParrain}
            selectedParrainId={selectedParrainId}
            openParrain2={openParrain2}
            setOpenParrain2={setOpenParrain2}
            selectedParrain2={selectedParrain2}
            handleSelectParrain2={handleSelectParrain2}
            selectedParrain2Id={selectedParrain2Id}
            openParrain3={openParrain3}
            setOpenParrain3={setOpenParrain3}
            selectedParrain3={selectedParrain3}
            handleSelectParrain3={handleSelectParrain3}
            selectedParrain3Id={selectedParrain3Id}
          />
          <FormStatusMessage status={formStatus} />
          <SubmitButton isSubmitting={isSubmitting} />
        </>
      )}
    </form>
  );
}
