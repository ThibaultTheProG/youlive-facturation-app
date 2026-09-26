"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FactureDetaillee } from "@/lib/types";
import { tvaParDefaut } from "@/utils/montantsFacture";

interface RemplacerFactureDialogProps {
  facture: FactureDetaillee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplaced: () => void | Promise<void>;
}

/**
 * Confirme l'annulation d'une facture non envoyée et son remplacement.
 * L'aperçu reprend le calcul de la route : mêmes montants HT, TVA selon le
 * profil actuel du conseiller.
 */
export default function RemplacerFactureDialog({
  facture,
  open,
  onOpenChange,
  onReplaced,
}: RemplacerFactureDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!facture) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/factures/${facture.id}/remplacer`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }
      await onReplaced();
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

  const ht = Number(facture.retrocession) || 0;
  const tvaActuelle = Number(facture.montant_tva ?? 0);

  const nouvelleApply = tvaParDefaut(facture.type, facture.conseiller);
  const nouveauTaux = facture.conseiller.taux_tva ?? 20;
  const nouvelleTva = nouvelleApply
    ? Number(((ht * nouveauTaux) / 100).toFixed(2))
    : 0;

  const libelle = facture.numero ? `n° ${facture.numero}` : `#${facture.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Annuler et remplacer la facture {libelle}</DialogTitle>
          <DialogDescription>
            Réservé aux factures jamais envoyées : elles n&apos;ont pas été
            émises et s&apos;annulent sans avoir. La facture d&apos;origine
            reste visible ici, marquée annulée, et disparaît de l&apos;espace
            du conseiller. La nouvelle facture est créée sans numéro et non
            envoyée.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm py-2">
          <div className="rounded-md border p-3 space-y-1">
            <div className="font-semibold">Facture annulée</div>
            <div>HT : {fmt(ht)} €</div>
            <div>TVA : {fmt(tvaActuelle)} €</div>
            <div className="font-semibold">TTC : {fmt(ht + tvaActuelle)} €</div>
          </div>
          <div className="rounded-md border border-green-600 bg-green-50 p-3 space-y-1">
            <div className="font-semibold">Nouvelle facture</div>
            <div>HT : {fmt(ht)} €</div>
            <div>
              TVA{nouvelleApply ? ` (${nouveauTaux} %)` : ""} : {fmt(nouvelleTva)} €
            </div>
            <div className="font-semibold">TTC : {fmt(ht + nouvelleTva)} €</div>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          La TVA suit le profil actuel du conseiller
          {facture.type === "recrutement" ? " pour ses recrutements" : ""}.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Retour
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Remplacement…" : "Annuler et remplacer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
