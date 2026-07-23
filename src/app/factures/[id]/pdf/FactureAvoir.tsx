"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { FactureDetaillee } from "@/lib/types";
import { computeMontantsFacture } from "@/utils/montantsFacture";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  section: { marginBottom: 10, marginLeft: 5 },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  flexRow: { flexDirection: "row", justifyContent: "space-between" },
  headerInfo: { fontSize: 10, marginBottom: 5 },
  highlight: {
    backgroundColor: "#93c2ff",
    color: "#fff",
    padding: 5,
    textAlign: "center",
  },
  table: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid #000",
    marginTop: 10,
  },
  tableRow: { flexDirection: "row" },
  tableCell: {
    padding: 5,
    flex: 1,
    textAlign: "left",
  },
  tableCellTotal: {
    padding: 5,
    flex: 1,
    borderRight: "1px solid #000",
    textAlign: "left",
  },
  motif: { padding: 5, marginTop: 4 },
  footer: { fontSize: 8, textAlign: "center", marginTop: 10 },
});

export default function FactureAvoir({
  facture,
}: {
  facture: FactureDetaillee;
}) {
  const user = facture.conseiller;

  const formatNumber = (num: number): string => num.toFixed(2);

  // Montant HT signé : positif = complément dû au conseiller (ajustement),
  // négatif = trop-perçu à rembourser (avoir).
  const {
    retrocessionHT: montantHT,
    tvaActive,
    tauxTVA,
    montantTVA,
    montantTTC,
  } = computeMontantsFacture(facture, user);

  const isAvoir = montantHT < 0;

  const documentLabel = isAvoir ? "AVOIR" : "FACTURE D'AJUSTEMENT";
  const montantLabel = isAvoir
    ? "Montant à rembourser TTC"
    : "Montant à régler TTC";

  const getTitle = () =>
    `${documentLabel} N°${facture.numero || "—"}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête : Informations du conseiller & Entreprise */}
        <View style={styles.flexRow}>
          <View>
            <Text style={[styles.bold, styles.headerInfo]}>
              {facture.conseiller.nom} {facture.conseiller.prenom}
            </Text>
            <Text style={styles.headerInfo}>
              Adresse : {facture.conseiller.adresse}
            </Text>
            <Text style={styles.headerInfo}>
              {facture.conseiller.telephone
                ? `Tél : ${facture.conseiller.telephone}`
                : `Mobile : ${facture.conseiller.mobile}`}
            </Text>
            <Text style={styles.headerInfo}>
              Mail : {facture.conseiller.email}
            </Text>
            <Text style={styles.headerInfo}>
              Siren : {facture.conseiller.siren}
            </Text>
          </View>
          <View>
            <Text style={[styles.bold, styles.headerInfo]}>
              SAS JMG &apos;Youlive&apos;
            </Text>
            <Text style={styles.headerInfo}>207 ter Rue du Dr Charcot</Text>
            <Text style={styles.headerInfo}>
              85100 Les Sables d&apos;Olonne
            </Text>
            <Text style={styles.headerInfo}>Tél : 02 51 01 60 24</Text>
            <Text style={[styles.headerInfo, styles.italic]}>
              Mail: contact@youlive.fr
            </Text>
            <Text style={styles.headerInfo}>Siren: 903 839 264</Text>
          </View>
        </View>

        {/* Date */}
        <Text style={{ textAlign: "right", marginTop: 10 }}>
          {isAvoir ? "Avoir créé le : " : "Facture créée le : "}
          {facture.created_at
            ? new Date(facture.created_at).toLocaleDateString("fr-FR", {
                timeZone: "Europe/Paris",
              })
            : "Date inconnue"}
        </Text>

        {/* Titre */}
        <Text style={styles.highlight}>{getTitle()}</Text>

        {/* Bloc DÉSIGNATION / motif */}
        <View style={[styles.table, { marginTop: 10 }]}>
          <View style={[styles.tableRow, { backgroundColor: "#b2d4ff" }]}>
            <Text style={[styles.tableCell, styles.bold]}>
              DÉSIGNATION - {isAvoir ? "régularisation" : "ajustement"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.motif}>{facture.motif || "—"}</Text>
          </View>
        </View>

        {/* Tableau des montants */}
        <View style={[styles.table, { marginTop: 15 }]}>
          <View
            style={[
              styles.tableRow,
              { backgroundColor: "#93c2ff", color: "#fff" },
            ]}
          >
            <Text style={styles.tableCellTotal}>Montant HT</Text>
            {tvaActive && (
              <Text style={styles.tableCellTotal}>TVA ({tauxTVA}%)</Text>
            )}
            <Text style={styles.tableCell}>{montantLabel}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellTotal}>
              {formatNumber(montantHT)} €
            </Text>
            {tvaActive && (
              <Text style={styles.tableCellTotal}>
                {formatNumber(montantTVA)} €
              </Text>
            )}
            <Text style={styles.tableCell}>{formatNumber(montantTTC)} €</Text>
          </View>
        </View>

        {/* Mode de paiement & TVA */}
        <Text style={{ marginTop: 10 }}>Mode de Règlement : Virement</Text>

        {!tvaActive ? (
          <Text style={{ fontSize: 10, marginTop: 10 }}>
            TVA non applicable - article 293 B du CGI
          </Text>
        ) : null}

        {/* Mentions légales */}
        <Text style={styles.footer}>
          {isAvoir
            ? "Le présent avoir régularise un trop-perçu. Le montant indiqué est à rembourser à la SAS JMG 'Youlive'."
            : "La présente facture d'ajustement complète une facture précédente. Le montant indiqué reste dû au conseiller."}
        </Text>
        <Text style={styles.footer}>
          Conformément à l&apos;Article L441-3, modifié par LOI n°2012-387 du 22
          mars 2012 - art. 121 M, créé par Décret n°2012-1115 du 2 octobre 2012
          - art. 1.
        </Text>
      </Page>
    </Document>
  );
}
