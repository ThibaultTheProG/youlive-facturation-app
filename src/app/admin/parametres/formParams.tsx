"use client";

import { useEffect, useState, useMemo } from "react";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Label } from "@/components/ui/label";
import RadioCustom from "@/components/uiCustom/radioCustom";
import { Conseiller } from "@/lib/types";
import PopoverCustom from "@/components/uiCustom/popoverCustom";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import SubmitButton from "@/components/uiCustom/submitButton";
import FormStatusMessage, { FormStatusType } from "@/components/uiCustom/formStatusMessage";
import useConseillers from "@/hooks/useConseillers";
import { calculRetrocession } from "@/utils/calculs";

// Composant principal
export default function FormParams() {
  const router = useRouter();
  const localConseillers = useConseillers();
  
  // États
  const [selectedConseiller, setSelectedConseiller] = useState<Conseiller | null>(null);
  const [assujettiTVA, setAssujettiTVA] = useState<string>("non");
  const [autoParrain, setAutoParrain] = useState<string>("non");
  const [selectedTypeContrat, setSelectedTypeContrat] = useState<string>("");
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [retrocession, setRetrocession] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatusType>({ type: null, message: null });
  
  // États pour les popovers
  const [openConseiller, setOpenConseiller] = useState(false);
  const [openParrain1, setOpenParrain1] = useState(false);
  const [openParrain2, setOpenParrain2] = useState(false);
  const [openParrain3, setOpenParrain3] = useState(false);
  
  // États pour les parrains
  const [selectedParrain, setSelectedParrain] = useState<string>("Aucun");
  const [selectedParrainId, setSelectedParrainId] = useState<number | null>(null);
  const [selectedParrain2, setSelectedParrain2] = useState<string>("Aucun");
  const [selectedParrain2Id, setSelectedParrain2Id] = useState<number | null>(null);
  const [selectedParrain3, setSelectedParrain3] = useState<string>("Aucun");
  const [selectedParrain3Id, setSelectedParrain3Id] = useState<number | null>(null);
  
  // Synchroniser les champs lorsque selectedConseiller change
  useEffect(() => {
    if (selectedConseiller) {
      const { tva, auto_parrain, typecontrat, chiffre_affaires } = selectedConseiller;
      
      setSelectedTypeContrat(typecontrat || "");
      setChiffreAffaires(chiffre_affaires || 0);
      setAssujettiTVA(tva ? "oui" : "non");
      if (auto_parrain) {
        setAutoParrain(auto_parrain);
      }
    }
  }, [selectedConseiller]);
  
  // Calculer la rétrocession à chaque changement de chiffre d'affaires ou de type de contrat
  useEffect(() => {
    if (chiffreAffaires > 0 && selectedTypeContrat) {
      const calculatedRetrocession = calculRetrocession(selectedTypeContrat, chiffreAffaires, autoParrain);
      setRetrocession(calculatedRetrocession);
    } else {
      setRetrocession(0);
    }
  }, [chiffreAffaires, selectedTypeContrat, autoParrain]);
  
  // Définir un type pour les éléments de la liste
  type SelectItemWithKey = {
    key: number;
    name: string;
  };

  // Données dérivées
  const conseillersNoms = useMemo(() => 
    (localConseillers || [])
      .map((conseiller: Conseiller) => ({
        key: conseiller.id,
        name: `${conseiller.prenom.trim()} ${conseiller.nom.trim()}`,
      }))
      .sort((a: SelectItemWithKey, b: SelectItemWithKey) => a.name.localeCompare(b.name)),
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
      .sort((a: SelectItemWithKey, b: SelectItemWithKey) => a.name.localeCompare(b.name));
    
    // Ajouter l'option "Aucun" au début de la liste
    return [aucunOption, ...parrainsList];
  }, [localConseillers, selectedConseiller]);
  
  // Gestionnaires d'événements
  const handleSelectConseiller = async (val: string) => {
    const conseiller = localConseillers.find(
      (c: Conseiller) => `${c.prenom.trim()} ${c.nom.trim()}` === val
    );
    
    setSelectedConseiller(conseiller || null);
    
    if (conseiller) {
      try {
        // @ts-expect-error - Le type 'loading' n'est pas dans FormStatusType mais fonctionne
        setFormStatus({ type: "loading", message: "Chargement des informations..." });
        
        // Récupération de tous les parrains en une seule requête
        const response = await fetch(`/api/conseillers/getParrainages?idConseiller=${conseiller.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
        }
        
        const parrainages = await response.json();
        
        // Mise à jour des états pour chaque niveau de parrain
        setSelectedParrain(parrainages.niveau1.nom);
        setSelectedParrainId(parrainages.niveau1.id);
        
        setSelectedParrain2(parrainages.niveau2.nom);
        setSelectedParrain2Id(parrainages.niveau2.id);
        
        setSelectedParrain3(parrainages.niveau3.nom);
        setSelectedParrain3Id(parrainages.niveau3.id);
        
        setFormStatus({ type: null, message: null });
      } catch (error) {
        console.error("Erreur lors de la récupération des parrainages:", error);
        setFormStatus({ 
          type: "error", 
          message: `Erreur: ${error instanceof Error ? error.message : String(error)}` 
        });
        
        // Réinitialiser les valeurs en cas d'erreur
        setSelectedParrain("Aucun");
        setSelectedParrainId(null);
        setSelectedParrain2("Aucun");
        setSelectedParrain2Id(null);
        setSelectedParrain3("Aucun");
        setSelectedParrain3Id(null);
      }
    } else {
      // Réinitialiser les valeurs si aucun conseiller n'est sélectionné
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
        setFormStatus({ type: 'error', message: "Veuillez sélectionner un conseiller" });
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
        adresse: formDataObj.adresse as string,
        siren: formDataObj.siren as string,
        tva: formDataObj.tva === "on",
        parrain_id: selectedParrainId,
        niveau2_id: selectedParrain2Id,
        niveau3_id: selectedParrain3Id
      };
      
      // Appel à l'API
      const response = await fetch("/api/conseillers/update", {
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

      toast.success("Conseiller mis à jour avec succès");
      setFormStatus({ type: 'success', message: "Conseiller mis à jour avec succès" });
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du conseiller", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la mise à jour du conseiller: ${errorMessage}`);
      setFormStatus({ type: 'error', message: `Erreur lors de la mise à jour du conseiller: ${errorMessage}` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rendu
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
      
      {selectedConseiller && (
        <>
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
                disable={false}
                name="adresse"
                label="Adresse"
                id="adresse"
                type="text"
                value={selectedConseiller?.adresse || ""}
              />
            </div>
            
            <div className="flex flex-row justify-start space-x-4">
              <InputCustom
                disable={true}
                name="siren"
                label="SIREN"
                id="siren"
                type="text"
                value={selectedConseiller?.siren || ""}
              />
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
            
            <div className="flex flex-row justify-start space-x-4">
              <div className="flex flex-col space-y-2">
                <Label>Type de contrat</Label>
                <select
                  className="border border-gray-300 rounded-md p-2"
                  value={selectedTypeContrat}
                  onChange={(e) => setSelectedTypeContrat(e.target.value)}
                  name="type_contrat"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="Offre Youlive">Offre Youlive</option>
                  <option value="Offre Découverte">Offre Découverte</option>
                </select>
              </div>
              
              <InputCustom
                disable={false}
                name="chiffre_affaires"
                label="Chiffre d'affaires annuel"
                id="chiffre_affaires"
                type="number"
                value={chiffreAffaires}
                onChange={(val) => setChiffreAffaires(Number(val))}
              />
              
              <InputCustom
                disable={true}
                name="retrocession"
                label="Pourcentage de rétrocession"
                id="retrocession"
                type="number"
                value={retrocession}
              />
            </div>

            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Gestion des parrainages</h2>
              <div className="grid grid-cols-3 gap-6">
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
          
          <FormStatusMessage status={formStatus} />
          
          <SubmitButton isSubmitting={isSubmitting} />
        </>
      )}
    </form>
  );
}
