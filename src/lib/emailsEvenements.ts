/**
 * Les emails envoyés par l'application et leurs destinataires paramétrables,
 * partagés par les routes, `emailsConfiguration.ts` et la page
 * `/admin/emails`.
 *
 * Module volontairement sans dépendance serveur : il est importé par des
 * composants client.
 *
 * Chaque email a un destinataire principal que le code détermine seul (le
 * conseiller concerné) ou que l'admin liste (l'administration). L'admin
 * ajoute en plus des adresses en copie (`cc`), et pour les emails adressés à
 * l'administration, il tient aussi la liste des destinataires (`a`).
 */

export type EvenementEmail =
  | "invitation"
  | "notification_facture"
  | "facture_admin"
  | "club99";

/** `a` : destinataires de la liste. `cc` : copie. */
export type ModeDestinataire = "a" | "cc";

export interface DefinitionEvenement {
  evenement: EvenementEmail;
  libelle: string;
  description: string;
  /** Qui reçoit l'email sans rien configurer. */
  principal: string;
  /** `a` n'existe que pour les emails dont le destinataire principal est une liste. */
  modes: ModeDestinataire[];
}

export const EVENEMENTS_EMAIL: DefinitionEvenement[] = [
  {
    evenement: "invitation",
    libelle: "Invitation à activer son espace",
    description:
      "Envoyé quand vous invitez un conseiller à choisir son mot de passe (page « Assigner un mot de passe »).",
    principal: "Le conseiller invité",
    modes: ["cc"],
  },
  {
    evenement: "notification_facture",
    libelle: "Nouvelle facture créée",
    description:
      "Envoyé chaque nuit au conseiller pour chaque facture créée à partir de ses contrats ou de ses recrutements.",
    principal: "Le conseiller concerné",
    modes: ["cc"],
  },
  {
    evenement: "facture_admin",
    libelle: "Facture envoyée à l'administration",
    description:
      "Envoyé quand un conseiller transmet une facture depuis son espace, pour qu'elle soit réglée.",
    principal: "L'administration",
    modes: ["a", "cc"],
  },
  {
    evenement: "club99",
    libelle: "Club des 99 %",
    description:
      "Envoyé une fois par an au conseiller qui franchit le seuil de 70 000 € de chiffre d'affaires.",
    principal: "Le conseiller concerné",
    modes: ["cc"],
  },
];

export const MODES: Record<ModeDestinataire, string> = {
  a: "Destinataires",
  cc: "En copie",
};

export function definitionEvenement(valeur: unknown): DefinitionEvenement | null {
  return EVENEMENTS_EMAIL.find((e) => e.evenement === valeur) ?? null;
}

const FORME_ADRESSE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

/** Adresse nettoyée (espaces, casse), ou `null` si elle n'a pas la forme d'une adresse. */
export function normaliserAdresse(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const adresse = valeur.trim().toLowerCase();
  if (adresse.length > 255 || !FORME_ADRESSE.test(adresse)) return null;
  return adresse;
}

/** Ligne de `emails_destinataires` telle que la page la lit. */
export interface DestinataireEmail {
  id: number;
  evenement: EvenementEmail;
  mode: ModeDestinataire;
  adresse: string;
}

/** Réponse de `GET /api/emails-destinataires`. */
export interface EmailsConfigurationReponse {
  destinataires: DestinataireEmail[];
  /**
   * Adresses en vigueur faute de configuration, par `evenement:mode` : celles
   * des variables d'environnement. Absentes dès qu'une adresse est ajoutée.
   */
  parDefaut: Partial<Record<string, string[]>>;
}
