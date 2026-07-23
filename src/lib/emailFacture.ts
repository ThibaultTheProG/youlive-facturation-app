import type { MontantsFacture } from "@/utils/montantsFacture";

/**
 * Construction du mail envoyé aux administrateurs (Tiphaine, Laura, Thibault)
 * lorsqu'un conseiller envoie une facture depuis son espace.
 *
 * Fonction pure : aucun accès base ni SMTP, pour pouvoir être rendue et relue
 * sans rien envoyer.
 */

export interface FactureAdminEmailData {
  numero: string | null;
  type: string | null;
  tranche: string | null;
  /** Date de la facture (`factures.created_at`). */
  date: Date | null;
  statutPaiement: string | null;
  conseiller: {
    prenom: string | null;
    nom: string | null;
    email: string | null;
    nomSocieteFacture: string | null;
    sirenFacture: string | null;
  };
  montants: MontantsFacture;
  factureUrl: string;
}

const ACCENT = "#e67e22";
const BORDURE = "#e5e7eb";
const TEXTE_SECONDAIRE = "#6b7280";

const escapeHtml = (valeur: string): string =>
  valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatEuro = (montant: number): string =>
  montant.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPourcentage = (taux: number): string =>
  `${taux.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

const formatDate = (date: Date | null): string | null =>
  date
    ? date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

const libelleType = (type: string | null): string => {
  switch (type) {
    case "commission":
      return "Commission";
    case "recrutement":
      return "Commission de recrutement";
    case "avoir":
      return "Avoir / Ajustement";
    default:
      return type || "Facture";
  }
};

const libelleTranche = (tranche: string | null): string | null => {
  switch (tranche) {
    case "avant_seuil":
      return "Avant seuil (70 000 €)";
    case "apres_seuil":
      return "Après seuil (70 000 €)";
    default:
      return null;
  }
};

/** Lignes `[libellé, valeur]` ; les entrées sans valeur sont ignorées. */
type Ligne = [string, string | null];

const lignesUtiles = (lignes: Ligne[]): [string, string][] =>
  lignes.filter((ligne): ligne is [string, string] => Boolean(ligne[1]));

function blocHtml(titre: string, lignes: Ligne[]): string {
  const contenu = lignesUtiles(lignes)
    .map(
      ([libelle, valeur]) => `
            <tr>
              <td style="padding:6px 0;color:${TEXTE_SECONDAIRE};font-size:14px;">${escapeHtml(
        libelle
      )}</td>
              <td style="padding:6px 0;font-size:14px;text-align:right;">${escapeHtml(
                valeur
              )}</td>
            </tr>`
    )
    .join("");

  return `
        <h3 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:${TEXTE_SECONDAIRE};">${escapeHtml(
    titre
  )}</h3>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-top:1px solid ${BORDURE};">${contenu}
        </table>`;
}

function blocTexte(titre: string, lignes: Ligne[]): string {
  const contenu = lignesUtiles(lignes)
    .map(([libelle, valeur]) => `  ${libelle} : ${valeur}`)
    .join("\n");
  return `${titre.toUpperCase()}\n${contenu}`;
}

export function buildFactureAdminEmail(data: FactureAdminEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { montants, conseiller, factureUrl } = data;

  const type = libelleType(data.type);
  const tranche = libelleTranche(data.tranche);
  const nomConseiller =
    [conseiller.prenom, conseiller.nom].filter(Boolean).join(" ").trim() ||
    "Conseiller inconnu";
  const numero = data.numero ? `n°${data.numero}` : "sans numéro";
  const ttc = formatEuro(montants.montantTTC);

  const subject = `Facture ${type} ${numero} — ${nomConseiller} — ${ttc} TTC`;

  const lignesFacture: Ligne[] = [
    ["Numéro", data.numero],
    ["Type", type],
    // La notion de tranche n'a de sens que pour les commissions, même si la
    // colonne est renseignée sur d'autres types.
    ["Tranche", data.type === "commission" ? tranche : null],
    ["Date de la facture", formatDate(data.date)],
    ["Statut de paiement", data.statutPaiement],
  ];

  const lignesConseiller: Ligne[] = [
    ["Conseiller", nomConseiller],
    ["Email", conseiller.email],
    ["Société de facturation", conseiller.nomSocieteFacture],
    ["SIREN", conseiller.sirenFacture],
  ];

  const lignesMontants: Ligne[] = [
    ["Honoraires agence", montants.honorairesAgence ? formatEuro(montants.honorairesAgence) : null],
    [
      data.type === "recrutement" ? "Taux de parrainage" : "Taux de rétrocession",
      montants.tauxRetrocession ? formatPourcentage(montants.tauxRetrocession) : null,
    ],
    ["Montant HT", formatEuro(montants.retrocessionHT)],
    [
      "Apporteur d'affaires",
      montants.apporteurActif ? `− ${formatEuro(montants.apporteurAmount)}` : null,
    ],
    ["Base HT facturée", montants.apporteurActif ? formatEuro(montants.totalHT) : null],
    [
      montants.tvaActive ? `TVA (${formatPourcentage(montants.tauxTVA)})` : "TVA",
      montants.tvaActive ? formatEuro(montants.montantTVA) : "Non assujetti à la TVA",
    ],
  ];

  const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:600px;padding:24px;">
        <h2 style="margin:0 0 4px;color:${ACCENT};font-size:20px;">Facture ${escapeHtml(
          type
        )} ${escapeHtml(numero)}</h2>
        <p style="margin:0 0 16px;color:${TEXTE_SECONDAIRE};font-size:14px;">Envoyée par ${escapeHtml(
          nomConseiller
        )}</p>
${blocHtml("Facture", lignesFacture)}
${blocHtml("Conseiller", lignesConseiller)}
${blocHtml("Montants", lignesMontants)}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-top:2px solid #111827;margin-top:4px;">
          <tr>
            <td style="padding:12px 0;font-size:16px;font-weight:bold;">TOTAL TTC</td>
            <td style="padding:12px 0;font-size:20px;font-weight:bold;text-align:right;color:${ACCENT};">${escapeHtml(
              ttc
            )}</td>
          </tr>
        </table>
        <p style="margin:24px 0 8px;">
          <a href="${escapeHtml(
            factureUrl
          )}" target="_blank" style="background:${ACCENT};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;font-size:14px;">Voir la facture</a>
        </p>
        <p style="margin:0;color:${TEXTE_SECONDAIRE};font-size:13px;">Ou copiez ce lien dans votre navigateur :</p>
        <p style="margin:4px 0 24px;font-size:13px;word-break:break-all;">${escapeHtml(
          factureUrl
        )}</p>
        <p style="margin:0;font-size:14px;">Cordialement,<br />Thibault</p>
      </div>`;

  const text = [
    `Facture ${type} ${numero} — ${nomConseiller}`,
    "",
    blocTexte("Facture", lignesFacture),
    "",
    blocTexte("Conseiller", lignesConseiller),
    "",
    blocTexte("Montants", lignesMontants),
    `  TOTAL TTC : ${ttc}`,
    "",
    `Voir la facture : ${factureUrl}`,
    "",
    "Cordialement,",
    "Thibault",
  ].join("\n");

  return { subject, html, text };
}
