"use client";

import { Text } from "@react-pdf/renderer";
import { FactureDetaillee } from "@/lib/types";

/**
 * Sous le titre d'une facture de commission ou de recrutement : signale
 * qu'elle est annulée, ou qu'elle en remplace une autre.
 */
export default function MentionAnnulation({ facture }: { facture: FactureDetaillee }) {
  if (facture.annulee) {
    const le = facture.annulee_le
      ? ` LE ${new Date(facture.annulee_le).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`
      : "";
    return (
      <Text style={{ color: "#c00", textAlign: "center", fontSize: 14, marginTop: 6 }}>
        FACTURE ANNULÉE{le} — NON ÉMISE, NE PAS RÉGLER
      </Text>
    );
  }
  if (facture.remplace) {
    return (
      <Text style={{ textAlign: "center", fontSize: 10, marginTop: 6 }}>
        Annule et remplace la facture n° {facture.remplace.numero || `#${facture.remplace.id}`}
      </Text>
    );
  }
  return null;
}
