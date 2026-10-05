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

interface AnnulerAvoirDialogProps {
  facture: FactureDetaillee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: () => void | Promise<void>;
}

/**
 * Confirme l'annulation d'un avoir / ajustement non envoyé. Rien ne le
 * remplace : s'il doit être refait, il se recrée depuis le suivi.
 */
export default function AnnulerAvoirDialog({
  facture,
  open,
  onOpenChange,
  onCancelled,
}: AnnulerAvoirDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!facture) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/factures/${facture.id}/annuler`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }
      await onCancelled();
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
  const tva = Number(facture.montant_tva ?? 0);
  const nature = ht < 0 ? "l'avoir" : "l'ajustement";
  const libelle = facture.numero ? `n° ${facture.numero}` : `#${facture.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>
            Annuler {nature} {libelle}
          </DialogTitle>
          <DialogDescription>
            Réservé aux documents jamais envoyés : ils n&apos;ont pas été émis
            et s&apos;annulent sans contre-écriture. Le document reste visible
            ici, marqué annulé, et disparaît de l&apos;espace du conseiller.
            Rien ne le remplace : s&apos;il doit être refait, créez-en un
            nouveau.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border p-3 space-y-1 text-sm">
          <div className="font-semibold">
            {facture.conseiller.prenom} {facture.conseiller.nom}
          </div>
          {facture.motif && <div className="text-gray-600">{facture.motif}</div>}
          <div>HT : {fmt(ht)} €</div>
          <div>TVA : {fmt(tva)} €</div>
          <div className="font-semibold">TTC : {fmt(ht + tva)} €</div>
        </div>

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
            {submitting ? "Annulation…" : `Annuler ${nature}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
