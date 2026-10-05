"use client";

import { Text } from "@react-pdf/renderer";
import { FactureDetaillee } from "@/lib/types";

/**
 * Sous le titre d'une facture ou d'un avoir : signale que le document est
 * annulé, ou qu'il en remplace un autre.
 */
export default function MentionAnnulation({ facture }: { facture: FactureDetaillee }) {
  if (facture.annulee) {
    const le = facture.annulee_le
      ? ` LE ${new Date(facture.annulee_le).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`
      : "";
    return (
      <Text style={{ color: "#c00", textAlign: "center", fontSize: 14, marginTop: 6 }}>
        {facture.type === "avoir" && Number(facture.retrocession) < 0
          ? `AVOIR ANNULÉ${le} — NON ÉMIS, SANS EFFET`
          : `FACTURE ANNULÉE${le} — NON ÉMISE, NE PAS RÉGLER`}
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
