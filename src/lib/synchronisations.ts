/**
 * Description des synchronisations, partagée par les routes, le journal
 * (`journalSync.ts`) et la page `/admin/synchronisations`.
 *
 * Module volontairement sans dépendance serveur : il est importé par des
 * composants client.
 */

export type TypeSync =
  | "conseillers"
  | "contrats"
  | "proprietes"
  | "contacts"
  | "factures";

/** Statuts stockés dans `synchronisations.statut`. */
export type StatutSyncStocke = "en_cours" | "succes" | "avec_erreurs" | "echec";

/**
 * Statuts lus : `interrompue` n'est jamais écrit. C'est un `en_cours` plus
 * vieux que `DELAI_INTERRUPTION_MS` — une exécution tuée par Vercel ne peut
 * pas consigner son propre échec.
 */
export type StatutSync = StatutSyncStocke | "interrompue";

/**
 * `maxDuration` des routes de sync (300 s) plus une marge pour l'écriture de
 * fin. Au-delà, une ligne `en_cours` ne tourne plus.
 */
export const DELAI_INTERRUPTION_MS = 330_000;

export interface DefinitionSync {
  type: TypeSync;
  libelle: string;
  description: string;
  /** Route `GET` gardée par `requireCronOrAdmin`. */
  route: string;
  /** Avertissement affiché avant un lancement manuel, si la sync écrit à des conseillers. */
  emails?: string;
}

/** Dans l'ordre de la chaîne nocturne (`vercel.json`) : chaque étape s'appuie sur les précédentes. */
export const SYNCHRONISATIONS: DefinitionSync[] = [
  {
    type: "conseillers",
    libelle: "Conseillers",
    description:
      "Importe les conseillers depuis Apimo : nouveaux arrivants, coordonnées, identifiant légal.",
    route: "/api/conseillers",
  },
  {
    type: "contrats",
    libelle: "Contrats",
    description:
      "Importe les ventes signées, les honoraires de chaque conseiller et recalcule les chiffres d'affaires.",
    route: "/api/contrats",
    emails:
      "Un conseiller qui franchit le seuil des 70 000 € reçoit le mail « club des 99 % ».",
  },
  {
    type: "proprietes",
    libelle: "Propriétés",
    description:
      "Met à jour l'adresse et le numéro de mandat des biens rattachés aux contrats.",
    route: "/api/proprietes",
  },
  {
    type: "contacts",
    libelle: "Contacts",
    description:
      "Met à jour les fiches des acheteurs et des vendeurs rattachés aux contrats.",
    route: "/api/contacts",
  },
  {
    type: "factures",
    libelle: "Factures",
    description:
      "Génère les factures de commission et de recrutement des contrats importés depuis 7 jours.",
    route: "/api/factures/create",
    emails:
      "Chaque facture créée déclenche un mail de notification au conseiller concerné.",
  },
];

export const TYPES_SYNC = SYNCHRONISATIONS.map((s) => s.type);

export function estTypeSync(valeur: unknown): valeur is TypeSync {
  return TYPES_SYNC.includes(valeur as TypeSync);
}

export function definitionSync(type: string): DefinitionSync | undefined {
  return SYNCHRONISATIONS.find((s) => s.type === type);
}

export const LIBELLES_STATUT: Record<StatutSync, string> = {
  en_cours: "En cours",
  succes: "Succès",
  avec_erreurs: "Avec erreurs",
  echec: "Échec",
  interrompue: "Interrompue",
};

/** Libellés des compteurs renvoyés par les routes (clés de `synchronisations.resume`). */
const LIBELLES_RESUME: Record<TypeSync, Record<string, string>> = {
  conseillers: {
    conseillers_apimo: "Conseillers lus dans Apimo",
    crees: "Conseillers créés",
    mis_a_jour: "Conseillers mis à jour",
    ignores_sans_nom: "Ignorés (sans nom)",
    parrainages_crees: "Fiches de parrainage créées",
    erreurs: "Erreurs",
  },
  contrats: {
    contrats_crees: "Contrats créés",
    contrats_maj: "Contrats mis à jour",
    relations_creees: "Honoraires conseiller créés",
    relations_maj: "Honoraires conseiller mis à jour",
    contacts_crees: "Acheteurs / vendeurs rattachés",
    ca_recalcules: "Chiffres d'affaires recalculés",
    emails_club99: "Mails « club des 99 % » envoyés",
  },
  proprietes: {
    proprietes_apimo: "Propriétés lues dans Apimo",
    creees: "Propriétés créées",
    mises_a_jour: "Propriétés mises à jour",
    sans_contrat_associe: "Sans contrat associé",
    erreurs: "Erreurs",
  },
  contacts: {
    contacts_apimo: "Contacts lus dans Apimo",
    attendus: "Contacts rattachés à un contrat",
    crees: "Contacts créés",
    mis_a_jour: "Contacts mis à jour",
    introuvables_apimo: "Introuvables dans Apimo",
    erreurs: "Erreurs",
  },
  factures: {
    relations_traitees: "Ventes examinées (7 derniers jours)",
    factures_commission: "Factures de commission créées",
    factures_recrutement: "Factures de recrutement créées",
  },
};

/** Compteurs de volume : utiles dans le détail, pas dans le résumé d'une ligne. */
const CLES_DE_VOLUME = new Set([
  "conseillers_apimo",
  "proprietes_apimo",
  "contacts_apimo",
  "attendus",
  "relations_traitees",
  "ignores_sans_nom",
  "sans_contrat_associe",
]);

export type ResumeSync = Record<string, unknown>;

/** Toutes les lignes du résumé, libellées, dans l'ordre déclaré ci-dessus. */
export function detailResume(
  type: string,
  resume: ResumeSync | null | undefined
): { cle: string; libelle: string; valeur: string }[] {
  if (!resume) return [];
  const libelles = LIBELLES_RESUME[type as TypeSync] ?? {};
  const cles = [
    ...Object.keys(libelles).filter((cle) => cle in resume),
    ...Object.keys(resume).filter((cle) => !(cle in libelles)),
  ];
  return cles.map((cle) => ({
    cle,
    libelle: libelles[cle] ?? cle,
    valeur: String(resume[cle]),
  }));
}

/** Ce que le passage a changé, en une phrase : les compteurs non nuls, hors volumes. */
export function phraseResume(
  type: string,
  resume: ResumeSync | null | undefined
): string {
  if (!resume) return "";
  const changements = detailResume(type, resume).filter(
    ({ cle, valeur }) => !CLES_DE_VOLUME.has(cle) && Number(valeur) > 0
  );
  if (changements.length === 0) return "Aucun changement";
  return changements
    .map(({ libelle, valeur }) => `${libelle} : ${valeur}`)
    .join(" · ");
}

/** Un passage, tel que le renvoie `GET /api/synchronisations`. */
export interface PassageSync {
  id: number;
  type: string;
  declencheur: "cron" | "manuel";
  /** Prénom et nom de l'admin ; `null` pour le cron. */
  auteur: string | null;
  debut: string;
  fin: string | null;
  duree_ms: number | null;
  statut: StatutSync;
  resume: ResumeSync | null;
  erreur: string | null;
}

export interface JournalSyncReponse {
  lignes: PassageSync[];
  total: number;
  page: number;
  pages: number;
  derniers: Record<TypeSync, PassageSync | null>;
}
