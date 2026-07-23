"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import RadioCustom from "@/components/uiCustom/radioCustom";

interface ConseillerLite {
  id: number;
  prenom: string | null;
  nom: string | null;
  tva: boolean;
  taux_tva: number | null;
}

const fetchConseillers = async (url: string): Promise<ConseillerLite[]> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

interface CreateAvoirDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void | Promise<void>;
}

export default function CreateAvoirDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateAvoirDialogProps) {
  // Le parent remonte ce dialogue à chaque ouverture (via une `key`), donc
  // l'état local repart de zéro sans effet de réinitialisation.
  const [userId, setUserId] = useState<string>("");
  const [montant, setMontant] = useState<string>("");
  const [motif, setMotif] = useState<string>("");
  const [assujetti, setAssujetti] = useState<string>("non");
  const [taux, setTaux] = useState<number>(20);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Liste des conseillers : SWR gère le chargement et le cache, sans effet.
  const { data: conseillers = [], isLoading: loadingConseillers } = useSWR<
    ConseillerLite[]
  >(open ? "/api/conseillers/get?includeInactifs=true" : null, fetchConseillers);

  // Le choix du conseiller préremplit la TVA depuis son profil.
  const handleConseillerChange = (value: string) => {
    setUserId(value);
    const conseiller = conseillers.find((c) => String(c.id) === value);
    if (conseiller) {
      setAssujetti(conseiller.tva ? "oui" : "non");
      setTaux(conseiller.taux_tva != null ? conseiller.taux_tva : 20);
    }
  };

  const montantNum = Number(montant);
  const montantValide =
    montant.trim() !== "" && !Number.isNaN(montantNum) && montantNum !== 0;
  const isAvoir = montantValide && montantNum < 0;

  const montantTva =
    assujetti === "oui" && montantValide
      ? Number(((montantNum * taux) / 100).toFixed(2))
      : 0;
  const montantTtc = montantValide ? montantNum + montantTva : 0;

  const handleSubmit = async () => {
    setError(null);
    if (!userId) {
      setError("Veuillez sélectionner un conseiller.");
      return;
    }
    if (!montantValide) {
      setError("Veuillez saisir un montant HT non nul.");
      return;
    }
    if (motif.trim() === "") {
      setError("Veuillez saisir un motif / désignation.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/factures/avoir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          montant_ht: montantNum,
          motif: motif.trim(),
          apply_tva: assujetti === "oui",
          taux_tva: assujetti === "oui" ? taux : null,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }
      await onCreated();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un avoir / ajustement</DialogTitle>
          <DialogDescription>
            Document de régularisation manuelle, sans impact sur le CA. Montant
            HT positif = complément dû au conseiller (ajustement) ; négatif =
            trop-perçu à rembourser (avoir). Créé sans numéro et non envoyé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Conseiller */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="avoir-conseiller">Conseiller</Label>
            <Select value={userId} onValueChange={handleConseillerChange}>
              <SelectTrigger id="avoir-conseiller" className="w-full">
                <SelectValue
                  placeholder={
                    loadingConseillers
                      ? "Chargement…"
                      : "Sélectionner un conseiller"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-72">
                {conseillers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.prenom} {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montant HT */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="avoir-montant">Montant HT (€) — négatif pour un avoir</Label>
            <Input
              id="avoir-montant"
              type="number"
              step="0.01"
              placeholder="ex : 235.62 ou -1435.50"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />
          </div>

          {/* Motif */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="avoir-motif">Motif / désignation</Label>
            <textarea
              id="avoir-motif"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="ex : Régularisation commissions mandats 2360 et 2439 (factures 13560/13561/13568)"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />
          </div>

          {/* TVA */}
          <div className="flex flex-col space-y-2">
            <Label>Assujettie à la TVA</Label>
            <RadioCustom
              name="avoir_apply_tva"
              value={assujetti}
              onChange={setAssujetti}
            />
          </div>

          {assujetti === "oui" && (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="avoir-taux">Taux de TVA (%)</Label>
              <Input
                id="avoir-taux"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taux}
                onChange={(e) => setTaux(Number(e.target.value))}
              />
            </div>
          )}

          {/* Aperçu */}
          {montantValide && (
            <div className="rounded-md bg-gray-50 border p-3 text-sm space-y-1">
              <div className="font-semibold">
                {isAvoir ? "Avoir" : "Facture d'ajustement"}
              </div>
              <div>Montant HT : {fmt(montantNum)} €</div>
              {assujetti === "oui" && <div>TVA ({taux}%) : {fmt(montantTva)} €</div>}
              <div className="font-semibold">
                {isAvoir ? "À rembourser TTC" : "À régler TTC"} : {fmt(montantTtc)} €
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Création…" : "Créer l'avoir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
