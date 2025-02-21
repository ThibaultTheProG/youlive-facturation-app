"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { FactureDetaillee } from "@/lib/types"; // Import du type de facture

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  section: { marginBottom: 10, marginLeft: 5 },
  title: { fontSize: 14, textAlign: "center", marginBottom: 15 },
  bold: { fontWeight: "bold" },
  textIndent: { marginLeft: 10 },
  italic: { fontStyle: "italic" },
  flexRow: { flexDirection: "row", justifyContent: "space-between" },
  headerInfo: { fontSize: 10, marginBottom: 5 },
  highlight: {
    backgroundColor: "#E07C24",
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
    //borderRight: "1px solid #000",
    textAlign: "left",
  },
  tableCellTotal: {
    padding: 5,
    flex: 1,
    borderRight: "1px solid #000",
    textAlign: "left",
  },
  footer: { fontSize: 8, textAlign: "center", marginTop: 10 },
});

export default function FactureRecrutement({
  facture,
}: {
  facture: FactureDetaillee;
}) {
  const user = facture.conseiller;

  let amountTTC;

  if (user.tva) {
    amountTTC = Math.round(
      facture.retrocession + (facture.retrocession * facture.vat_rate) / 100
    );
  }

  const retrocession = Math.round(
    (facture.retrocession / facture.honoraires_agent) * 100
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête : Informations du conseiller & Entreprise */}
        <View style={styles.flexRow}>
          <View>
            <Text style={[styles.bold, styles.headerInfo]}>
              EI {facture.conseiller.nom} {facture.conseiller.prenom}
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
            <Text style={styles.headerInfo}>2 impasse du Pélican</Text>
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
          Facture créée le :{" "}
          {new Date(facture.created_at).toLocaleDateString("fr-FR", {
            timeZone: "UTC",
          })}
        </Text>

        {/* Titre */}
        <Text style={styles.highlight}>
          FACTURE RECRUTEMENT N°{facture.numero}
        </Text>

        {/* Bloc DÉSIGNATION */}
        <View style={[styles.table, { marginTop: 10 }]}>
          {/* Titre DÉSIGNATION */}
          <View style={[styles.tableRow, { backgroundColor: "#ffe6d2" }]}>
            <Text style={[styles.tableCell, styles.bold]}>
              DÉSIGNATION - prestation de services
            </Text>
          </View>

          {/* Filleul */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              Nom du collaborateur : {facture.filleul?.prenom}{" "}
              {facture.filleul?.nom}
            </Text>
          </View>

          {/* Numéro de mandat */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              N° de mandat : {facture.numero_mandat}
            </Text>
          </View>
        </View>

        {/* Tableau des montants */}
        <View style={[styles.table, { marginTop: 15 }]}>
          <View
            style={[
              styles.tableRow,
              { backgroundColor: "#f28c1e", color: "#fff" },
            ]}
          >
            <Text style={styles.tableCellTotal}>Honoraires Youlive HT</Text>
            <Text style={styles.tableCellTotal}>% Rétrocession</Text>
            <Text style={styles.tableCellTotal}>Rétrocession HT</Text>
            {user.tva && <Text style={styles.tableCellTotal}>TVA</Text>}
            <Text style={styles.tableCell}>Montant à régler TTC</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellTotal}>
              {facture.honoraires_agent} €
            </Text>
            <Text style={styles.tableCellTotal}>{retrocession}%</Text>
            <Text style={styles.tableCellTotal}>{facture.retrocession} €</Text>
            {user.tva && <Text style={styles.tableCellTotal}>20 %</Text>}
            <Text style={styles.tableCell}>
              {amountTTC || Math.round(facture.retrocession)} €
            </Text>
          </View>
        </View>

        {/* Mode de paiement & TVA */}
        <Text style={{ marginTop: 10 }}>Mode de Règlement : Virement</Text>

        {!user.tva ? (
          <Text style={{ fontSize: 10, marginTop: 10 }}>
            TVA non applicable - article 293 B du CGI
          </Text>
        ) : null}

        {/* Mentions légales */}
        <Text style={styles.footer}>
          Le règlement n&apos;est dû qu&apos;après réception par le client de
          l&apos;ensemble des éléments composants l&apos;intégralité du dossier
          et permettant de le clôturer, notamment facture de vente ou location
          honorée, etc.
        </Text>
        <Text style={styles.footer}>
          Conformément à l&apos;Article L441-3, modifié par LOI n°2012-387 du 22
          mars 2012 - art. 121 M, créé par Décret n°2012-1115 du 2 octobre 2012
          - art. 1. En cas de retard de règlement, une indemnité forfaitaire de
          40€ est due, outre les indemnités de retard s&apos;élevant à 3 fois le
          taux légal.
        </Text>
      </Page>
    </Document>
  );
}
