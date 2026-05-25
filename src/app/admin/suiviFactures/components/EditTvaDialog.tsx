"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FactureDetaillee } from "@/lib/types";
import RadioCustom from "@/components/uiCustom/radioCustom";

interface EditTvaDialogProps {
  facture: FactureDetaillee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void | Promise<void>;
}

export default function EditTvaDialog({
  facture,
  open,
  onOpenChange,
  onSaved,
}: EditTvaDialogProps) {
  const userTva = facture?.conseiller.tva ?? false;
  const userTaux = facture?.conseiller.taux_tva ?? 20;

  const initialApply =
    facture?.apply_tva === null || facture?.apply_tva === undefined
      ? userTva
      : facture.apply_tva;
  const initialTaux = facture?.taux_tva ?? userTaux;

  const [assujetti, setAssujetti] = useState<string>(
    initialApply ? "oui" : "non",
  );
  const [taux, setTaux] = useState<number>(Number(initialTaux));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && facture) {
      const apply =
        facture.apply_tva === null || facture.apply_tva === undefined
          ? userTva
          : facture.apply_tva;
      setAssujetti(apply ? "oui" : "non");
      setTaux(Number(facture.taux_tva ?? userTaux));
      setError(null);
    }
  }, [open, facture, userTva, userTaux]);

  const handleSubmit = async () => {
    if (!facture) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/factures/${facture.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apply_tva: assujetti === "oui",
          taux_tva: assujetti === "oui" ? taux : null,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }
      await onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!facture) return null;

  const baseRetro = Number(facture.retrocession) || 0;
  const previewMontantTva =
    assujetti === "oui" ? Number(((baseRetro * taux) / 100).toFixed(2)) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Modifier la TVA — facture {facture.numero}</DialogTitle>
          <DialogDescription>
            Modifie la TVA pour cette facture uniquement. Par défaut conseiller
            : {userTva ? `oui (${userTaux}%)` : "non"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col space-y-2">
            <Label>Assujettie à la TVA</Label>
            <RadioCustom
              name="apply_tva"
              value={assujetti}
              onChange={setAssujetti}
            />
          </div>

          {assujetti === "oui" && (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="taux_tva_facture">Taux de TVA (%)</Label>
              <Input
                id="taux_tva_facture"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taux}
                onChange={(e) => setTaux(Number(e.target.value))}
              />
            </div>
          )}

          <div className="text-sm text-gray-600">
            Montant TVA recalculé :{" "}
            <span className="font-semibold">
              {previewMontantTva.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </span>{" "}
            (base : {baseRetro.toLocaleString("fr-FR")} €)
          </div>

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
            {submitting ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
