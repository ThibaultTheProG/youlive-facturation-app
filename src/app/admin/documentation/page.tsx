import {
  BookOpen,
  CalendarClock,
  CircleHelp,
  FileCheck,
  Calculator,
  KeyRound,
  LifeBuoy,
  Mail,
  RefreshCw,
  Settings,
  Workflow,
  Languages,
} from "lucide-react";
import { PastilleAnnulee, PastilleEnvoi, PastillePaiement, PastilleType } from "@/components/factures/pastilles";
import { Definitions, Encart, Etapes, Frise, Section, SousTitre, Ui } from "./blocs";
import { Sommaire } from "./Sommaire";

export const metadata = { title: "Documentation" };

const SOMMAIRE = [
  { id: "vue-ensemble", titre: "Vue d’ensemble" },
  { id: "nuit", titre: "Ce qui se passe la nuit" },
  { id: "factures", titre: "Le cycle d’une facture" },
  { id: "calculs", titre: "Le calcul des montants" },
  { id: "parametres", titre: "Paramètres conseillers" },
  { id: "suivi", titre: "Suivi des factures" },
  { id: "corrections", titre: "Corriger une erreur" },
  { id: "acces", titre: "Accès des conseillers" },
  { id: "synchronisations", titre: "Page Synchronisations" },
  { id: "emails", titre: "Page Emails" },
  { id: "faq", titre: "Questions fréquentes" },
  { id: "glossaire", titre: "Glossaire" },
];

const FACTURE_COMMISSION = { type: "commission", retrocession: "1" };
const FACTURE_RECRUTEMENT = { type: "recrutement", retrocession: "1" };
const FACTURE_AVOIR = { type: "avoir", retrocession: "-1" };
const FACTURE_AJUSTEMENT = { type: "avoir", retrocession: "1" };

function Question({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-white open:shadow-sm">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-gray-900 marker:text-gray-400">
        {question}
      </summary>
      <div className="space-y-2 border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-600">{children}</div>
    </details>
  );
}

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef3e8]">
            <BookOpen className="h-5 w-5 text-[#E07C24]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documentation</h1>
            <p className="mt-0.5 text-sm text-gray-500">Comment fonctionne l’application, et comment s’en servir au quotidien</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
          <Sommaire entrees={SOMMAIRE} />

          <article className="min-w-0 max-w-4xl space-y-14 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
            {/* ───────────────────────────── Vue d'ensemble */}
            <Section id="vue-ensemble" titre="Vue d’ensemble" icone={Workflow}>
              <p>
                L’application prépare les factures que chaque conseiller adresse à Youlive, à partir des ventes
                enregistrées dans Apimo. <strong>Vous n’avez normalement rien à saisir</strong> : les ventes arrivent
                d’Apimo, les factures se créent seules, le conseiller les complète et les envoie, et vous suivez leur
                paiement.
              </p>
              <Frise
                etapes={[
                  { titre: "Apimo", detail: "Les conseillers y saisissent leurs ventes, honoraires et mandats. C’est la source de toutes les données." },
                  { titre: "Synchronisation de nuit", detail: "L’application importe les nouveautés d’Apimo et crée les factures correspondantes." },
                  { titre: "Le conseiller", detail: "Il retrouve ses factures dans son espace, renseigne le numéro et la date, puis les envoie." },
                  { titre: "Vous", detail: "Vous recevez la facture par email, la réglez, puis la marquez comme payée dans le suivi." },
                ]}
              />
              <SousTitre>Qui fait quoi</SousTitre>
              <Definitions
                colonnes={["Acteur", "Rôle"]}
                lignes={[
                  ["Apimo", "Source des conseillers, ventes, honoraires, mandats, acheteurs et vendeurs. Toute erreur de ces données se corrige dans Apimo."],
                  ["L’application", "Importe, calcule les montants, crée les factures, génère les PDF et envoie les emails."],
                  ["Le conseiller", "Complète ses factures (numéro, date, apporteur d’affaire) et les envoie. Il peut aussi modifier son adresse, sa TVA et sa société de facturation."],
                  ["L’administration (vous)", "Règle les paramètres des conseillers, suit les paiements, établit les avoirs, surveille les synchronisations et choisit qui reçoit les emails de l’application."],
                ]}
              />
              <Encart ton="attention" titre="Ce qui se corrige dans Apimo, pas ici">
                <p>
                  Le nom, les coordonnées, l’identifiant légal (SIREN / RSAC / RCS), les ventes, les honoraires, les
                  numéros de mandat, les acheteurs et les vendeurs viennent d’Apimo. L’application les réécrit chaque
                  nuit : une correction faite ici serait écrasée. Corrigez dans Apimo, la synchronisation suivante
                  répercute le changement.
                </p>
              </Encart>
              <Encart titre="Les PDF se recomposent à chaque ouverture">
                <p>
                  Les <strong>montants</strong> d’une facture sont enregistrés à sa création. En revanche, les{" "}
                  <strong>mentions</strong> (identité, adresse, société de facturation, email, acheteurs, vendeurs,
                  mandat) sont relues au moment où le PDF s’ouvre : modifier une de ces informations change aussi
                  l’aspect des factures déjà émises quand on les rouvre.
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── La nuit */}
            <Section id="nuit" titre="Ce qui se passe la nuit" icone={CalendarClock}>
              <p>
                Cinq opérations s’enchaînent automatiquement, <strong>dans cet ordre</strong> : chacune s’appuie sur les
                précédentes. Elles démarrent à 2 h UTC, soit 3 h en hiver et 4 h en été (heure de Paris).
              </p>
              <Definitions
                colonnes={["Étape", "Ce qu’elle fait"]}
                lignes={[
                  [<><Ui>1</Ui> Conseillers</>, "Importe les nouveaux arrivants et met à jour les coordonnées et l’identifiant légal."],
                  [<><Ui>2</Ui> Contrats</>, "Importe les ventes clôturées et les honoraires de chaque conseiller, puis recalcule les chiffres d’affaires de l’année. Un conseiller qui franchit 70 000 € reçoit le mail « club des 99 % » (une seule fois par an)."],
                  [<><Ui>3</Ui> Propriétés</>, "Met à jour l’adresse et le numéro de mandat des biens vendus."],
                  [<><Ui>4</Ui> Contacts</>, "Met à jour les fiches des acheteurs et des vendeurs."],
                  [<><Ui>5</Ui> Factures</>, "Crée les factures de commission et de recrutement des ventes importées depuis 7 jours, et prévient chaque conseiller par email (un email par facture)."],
                ]}
              />
              <Encart ton="astuce" titre="Le bon réflexe du matin">
                <p>
                  Ouvrez <Ui>Synchronisations</Ui> : les cinq passages de la nuit doivent être en <strong>Succès</strong>.
                  Sinon, relancez l’étape en cause (voir « Page Synchronisations ») et prévenez Thibault si l’échec se répète.
                </p>
              </Encart>
              <Encart ton="attention" titre="La fenêtre de 7 jours">
                <p>
                  La création des factures ne regarde que les ventes importées depuis 7 jours. Une facture de recrutement
                  manquante parce que le parrain n’était pas renseigné au moment de l’import ne se recrée pas toute seule
                  quand on le renseigne ensuite : prévenez Thibault, la facture se crée à la main.
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── Cycle d'une facture */}
            <Section id="factures" titre="Le cycle d’une facture" icone={FileCheck}>
              <SousTitre>Les quatre types de documents</SousTitre>
              <Definitions
                colonnes={["Type", "Ce que c’est"]}
                lignes={[
                  [<PastilleType key="c" facture={FACTURE_COMMISSION} />, "La rétrocession due au conseiller sur sa propre vente."],
                  [<PastilleType key="r" facture={FACTURE_RECRUTEMENT} />, "Les honoraires de parrainage dus à un parrain quand son filleul réalise une vente (jusqu’à trois niveaux)."],
                  [<PastilleType key="a" facture={FACTURE_AVOIR} />, "Un document au montant négatif, qui annule tout ou partie d’une facture déjà émise."],
                  [<PastilleType key="j" facture={FACTURE_AJUSTEMENT} />, "Un document au montant positif, pour verser un complément au conseiller. Il se crée comme un avoir : seul le signe du montant change."],
                ]}
              />

              <SousTitre>Les statuts</SousTitre>
              <Definitions
                colonnes={["Statut", "Signification"]}
                lignes={[
                  [<PastilleEnvoi key="e0" statut="non envoyée" />, "Le conseiller n’a pas encore envoyé la facture."],
                  [<PastilleEnvoi key="e1" statut="envoyée" />, "La facture a été envoyée à l’administration par email."],
                  [<PastillePaiement key="p0" statut="non payé" />, "La facture n’est pas encore réglée."],
                  [<PastillePaiement key="p1" statut="payé" />, "Vous l’avez marquée comme payée ; la date de paiement est enregistrée."],
                  [<PastilleAnnulee key="an" />, "La facture a été annulée avant d’être émise. Elle reste visible ici mais disparaît de l’espace du conseiller."],
                ]}
              />

              <SousTitre>De la création au paiement</SousTitre>
              <Etapes
                etapes={[
                  {
                    titre: "Création automatique, la nuit",
                    texte: "La facture apparaît sans numéro, non envoyée et non payée. Le conseiller reçoit un email de notification.",
                  },
                  {
                    titre: "Le conseiller la complète",
                    texte: (
                      <>
                        Dans <Ui>Mes factures</Ui>, le bouton « Voir PDF » ouvre la fenêtre <Ui>Informations à renseigner</Ui> :
                        numéro de la facture, date, et apporteur d’affaire éventuel (oui ou non, avec son montant). Le PDF
                        s’ouvre ensuite.
                      </>
                    ),
                  },
                  {
                    titre: "Le conseiller l’envoie",
                    texte: "Le bouton d’envoi n’est disponible qu’une fois le numéro renseigné. L’administration reçoit alors un email avec le lien vers la facture, qui passe à « Envoyée ».",
                  },
                  {
                    titre: "Vous la réglez et la marquez payée",
                    texte: (
                      <>
                        Dans <Ui>Suivi des factures</Ui>, l’action « Marquer comme payée » passe la facture à « Payée » et
                        enregistre la date du jour. En cas de fausse manœuvre, « Repasser en non payée » annule l’opération.
                      </>
                    ),
                  },
                ]}
              />
              <Encart ton="attention" titre="Envoyée ou payée : on ne la modifie plus">
                <p>
                  Une facture envoyée ou payée a été émise. Pour la corriger, on ne la modifie pas : on l’annule par un
                  avoir (voir « Corriger une erreur »). Seule une facture jamais envoyée et jamais payée peut être
                  annulée et remplacée directement.
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── Calculs */}
            <Section id="calculs" titre="Le calcul des montants" icone={Calculator}>
              <SousTitre>La rétrocession sur une commission</SousTitre>
              <Definitions
                colonnes={["Contrat", "Taux"]}
                lignes={[
                  ["Offre Youlive", "70 % jusqu’à 70 000 € de chiffre d’affaires dans l’année, 99 % au-delà."],
                  ["Offre Découverte", "60 % jusqu’à 70 000 €, 99 % au-delà."],
                  ["Auto-parrainage", "Ajoute 6 points au taux, sans jamais dépasser 99 %."],
                ]}
              />
              <p>
                Le chiffre d’affaires est le total des honoraires HT de l’année civile : il repart de zéro chaque année.
                Il est recalculé chaque nuit à partir d’Apimo.
              </p>

              <SousTitre>Quand une vente fait franchir 70 000 €</SousTitre>
              <p>
                La commission est alors <strong>coupée en deux factures</strong> : une « avant seuil » au taux habituel
                pour la part qui rejoint les 70 000 €, une « après seuil » à 99 % pour le reste.
              </p>
              <Encart titre="Exemple">
                <p>
                  Un conseiller a déjà 65 000 € de chiffre d’affaires et réalise une vente à 10 000 € d’honoraires
                  (Offre Youlive). Les 5 000 € qui complètent le seuil sont rétrocédés à 70 % soit 3 500 € ; les 5 000 €
                  restants le sont à 99 % soit 4 950 €. Deux factures sont créées.
                </p>
              </Encart>

              <SousTitre>Les factures de recrutement</SousTitre>
              <p>
                Quand un filleul réalise une vente, ses parrains perçoivent un pourcentage des honoraires de cette vente :
              </p>
              <Definitions
                colonnes={["Niveau", "Part"]}
                lignes={[
                  ["Niveau 1 (parrain direct)", "6 %, ou 8 % si ce parrain a au moins 5 filleuls en niveau 1."],
                  ["Niveau 2 (parrain du parrain)", "2 %"],
                  ["Niveau 3", "1 %"],
                ]}
              />
              <p>
                Une fois que le filleul a atteint 70 000 € de chiffre d’affaires dans l’année, ses ventes ne génèrent plus
                de facture de recrutement.
              </p>

              <SousTitre>La TVA</SousTitre>
              <p>
                La TVA suit le <strong>profil du conseiller dans l’application</strong> (assujetti ou non, et son taux),
                jamais le taux saisi dans Apimo. Sans taux renseigné, 20 % s’applique : vérifiez le profil d’un conseiller
                assujetti.
              </p>
              <p>
                Une option distincte, « TVA sur les factures de recrutement », permet d’exclure la TVA des recrutements
                d’un conseiller assujetti : c’est le cas quand ils sont facturés par une société non assujettie
                (par exemple EASY RENT pour Maryline DELAHAYE).
              </p>
              <Encart titre="La TVA est figée à la création">
                <p>
                  Depuis le 25/09/2026, la TVA est enregistrée sur chaque facture au moment de sa création : modifier le
                  profil d’un conseiller ne change pas ses factures existantes. Les factures plus anciennes suivent encore
                  son profil.
                </p>
              </Encart>
              <Encart titre="Le montant de la liste n’est pas toujours le montant à régler">
                <p>
                  La rétrocession HT affichée ne tient pas compte de la somme éventuellement soustraite pour l’apporteur
                  d’affaire : le montant réellement dû figure sur le PDF.
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── Paramètres */}
            <Section id="parametres" titre="Paramètres conseillers" icone={Settings}>
              <p>
                Choisissez un conseiller dans le bandeau du haut : ses paramètres s’affichent en cinq onglets.{" "}
                <Ui>Valider</Ui> enregistre <strong>tous les onglets d’un coup</strong>.
              </p>
              <Definitions
                colonnes={["Onglet", "À quoi il sert"]}
                lignes={[
                  ["Identité", "Coordonnées venues d’Apimo, en lecture seule. Seule l’adresse se modifie. La zone rouge en bas permet de désactiver le compte."],
                  ["Contrat & CA", "Type de contrat (Offre Youlive ou Découverte), honoraires de l’année et taux de rétrocession. Le chiffre d’affaires est recalculé chaque nuit : ne le corrigez pas à la main."],
                  ["Fiscalité & options", "Assujettissement à la TVA, taux, TVA sur les recrutements, et auto-parrainage."],
                  ["Facturation recrutement", "Société au nom de laquelle sont établies les factures de recrutement et les avoirs qui les régularisent (nom, SIREN, adresse, email). Vide : l’identité du conseiller s’applique."],
                  ["Parrainage", "Les trois parrains du conseiller, du plus proche au plus éloigné. Ils décident des factures de recrutement."],
                ]}
              />
              <Encart ton="attention" titre="Parrainage : attendre le chargement">
                <p>
                  Le bouton <Ui>Valider</Ui> reste bloqué tant que les parrains du conseiller ne sont pas chargés : cela
                  évite d’en effacer un par erreur. S’il ne se débloque pas, sélectionnez de nouveau le conseiller.
                  Changer un parrain n’agit que sur les <strong>ventes futures</strong>, jamais sur les factures déjà créées.
                </p>
              </Encart>
              <Encart ton="attention" titre="Désactiver un compte">
                <p>
                  Le conseiller ne peut plus se connecter, il est retiré de tous les parrainages où il apparaît et son
                  propre parrainage est supprimé. Une confirmation est demandée avant d’agir.
                </p>
              </Encart>
              <Encart titre="Ce que le conseiller peut modifier lui-même">
                <p>
                  Dans « Mon compte » : son adresse, sa TVA (assujettissement, taux, TVA sur recrutement) et sa société
                  de facturation. Le contrat, le chiffre d’affaires et le parrainage ne dépendent que de vous.
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── Suivi */}
            <Section id="suivi" titre="Suivi des factures" icone={FileCheck}>
              <p>
                C’est l’écran de travail principal : toutes les factures de tous les conseillers, avec leur état d’envoi
                et de paiement.
              </p>
              <SousTitre>Retrouver une facture</SousTitre>
              <p>
                Cherchez par nom de conseiller ou par numéro de mandat, puis affinez par paiement, type ou envoi. Les
                en-têtes de colonne trient la liste. <Ui>Réinitialiser</Ui> efface tous les filtres.
              </p>
              <SousTitre>Les actions d’une ligne</SousTitre>
              <Definitions
                colonnes={["Action", "Effet"]}
                lignes={[
                  ["Marquer comme payée / Repasser en non payée", "Change le statut de paiement et enregistre (ou efface) la date de paiement."],
                  ["Voir le PDF", "Ouvre la facture dans un nouvel onglet."],
                  ["Modifier la TVA", "Change l’assujettissement et le taux pour cette facture seulement."],
                  ["Annuler et remplacer", "Pour une facture jamais envoyée : l’annule et en crée une nouvelle aux mêmes montants HT, sans numéro."],
                  ["Annuler l’avoir / l’ajustement", "Pour un avoir ou un ajustement jamais envoyé : l’annule sans le remplacer."],
                ]}
              />
              <p>
                <Ui>Exporter en Excel</Ui> télécharge toutes les factures, sans tenir compte des filtres.
              </p>
              <Encart ton="attention" titre="Modifier la TVA : réservé aux factures jamais émises">
                <p>
                  Une facture envoyée ou payée ne se corrige pas par la TVA : passez par un avoir puis une nouvelle
                  facture (voir ci-dessous).
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── Corrections */}
            <Section id="corrections" titre="Corriger une erreur" icone={LifeBuoy}>
              <p>Repérez votre situation, puis suivez l’action indiquée.</p>
              <Definitions
                colonnes={["Situation", "Que faire"]}
                lignes={[
                  ["La facture n’a jamais été envoyée et la TVA est fausse", <>Utilisez <Ui>Modifier la TVA</Ui>, ou <Ui>Annuler et remplacer</Ui> pour repartir d’une facture neuve.</>],
                  ["La facture n’a jamais été envoyée et doit être refaite (société, forme…)", <><Ui>Annuler et remplacer</Ui> : la nouvelle facture reprend les montants HT, calcule sa TVA d’après le profil actuel et n’a pas de numéro.</>],
                  ["La facture est envoyée ou payée et elle est fausse", <>Créez un <strong>avoir</strong> du montant à annuler. Si une facture juste doit la remplacer, créez ensuite un <strong>ajustement</strong> du montant correct.</>],
                  ["Un complément est dû au conseiller", <>Créez un <strong>ajustement</strong> (montant positif).</>],
                  ["Un avoir ou un ajustement a été créé par erreur", <><Ui>Annuler l’avoir</Ui> s’il n’a pas été envoyé. Il disparaît de l’espace du conseiller ; rien ne le remplace.</>],
                  ["Une facture a été marquée payée par erreur", <><Ui>Repasser en non payée</Ui>.</>],
                  ["Le montant HT d’une facture est faux", "Le montant vient d’Apimo : corrigez-le dans Apimo et prévenez Thibault, car une facture déjà créée ne se recalcule pas toute seule."],
                ]}
              />
              <SousTitre>Créer un avoir ou un ajustement</SousTitre>
              <Etapes
                etapes={[
                  { titre: "Ouvrir la fenêtre", texte: <>Dans <Ui>Suivi des factures</Ui>, bouton <Ui>Créer un avoir / ajustement</Ui>.</> },
                  { titre: "Choisir le conseiller et l’objet", texte: "« Régularise » : commissions ou recrutements. Pour un recrutement, le document est établi au nom de la société de facturation du conseiller (et non à son nom) et sa TVA suit l’option « TVA sur les recrutements »." },
                  { titre: "Saisir le montant HT", texte: "Négatif pour un avoir, positif pour un ajustement. La TVA est préremplie d’après le profil et reste modifiable." },
                  { titre: "Écrire le motif", texte: "C’est la désignation imprimée sur le PDF. Relisez-la : citez les numéros de facture avec soin, une coquille serait imprimée telle quelle." },
                ]}
              />
              <p>
                L’avoir est créé sans numéro et non envoyé ; il suit ensuite le même circuit qu’une facture (numéro, envoi,
                paiement). Il n’a aucun effet sur le chiffre d’affaires.
              </p>
            </Section>

            {/* ───────────────────────────── Accès */}
            <Section id="acces" titre="Accès des conseillers" icone={KeyRound}>
              <p>
                Vous ne saisissez et ne voyez <strong>jamais</strong> de mot de passe : chaque conseiller choisit le sien.
              </p>
              <Etapes
                etapes={[
                  { titre: "Le conseiller existe dans l’application", texte: "Les nouveaux arrivants apparaissent après la synchronisation de nuit « Conseillers »." },
                  { titre: "Envoyer l’invitation", texte: <>Dans <Ui>Assigner un mot de passe</Ui>, choisissez le conseiller puis <Ui>Envoyer l’invitation</Ui>.</> },
                  { titre: "Il définit son mot de passe", texte: "Il reçoit un email avec un lien valable 48 heures, utilisable une seule fois. Le mot de passe doit faire au moins 8 caractères." },
                ]}
              />
              <Encart ton="astuce" titre="Mot de passe oublié ?">
                <p>
                  Renvoyez simplement une invitation : le lien précédent devient invalide dès que le mot de passe change,
                  et un nouveau lien repart pour 48 heures. Les mêmes identifiants servent pour l’application « Avis de
                  valeur ».
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── Synchronisations */}
            <Section id="synchronisations" titre="Page Synchronisations" icone={RefreshCw}>
              <p>
                Elle sert à lancer à la main les opérations de la nuit et à consulter l’historique de tous les passages,
                automatiques ou manuels.
              </p>
              <Definitions
                colonnes={["Statut", "Signification"]}
                lignes={[
                  ["En cours", "L’opération tourne. Il est impossible de la relancer tant qu’elle n’est pas terminée."],
                  ["Succès", "Tout s’est bien passé."],
                  ["Avec erreurs", "L’opération est allée au bout mais certains éléments ont échoué : consultez le détail du passage."],
                  ["Échec", "L’opération s’est arrêtée. Le message d’erreur est conservé dans l’historique."],
                  ["Interrompue", "L’opération a été coupée en cours de route (délai dépassé). Relancez-la."],
                ]}
              />
              <p>
                Vous pouvez lancer une étape seule, ou <Ui>Tout synchroniser</Ui> pour enchaîner les cinq dans l’ordre. Une
                confirmation est demandée avant chaque lancement.
              </p>
              <Encart ton="attention" titre="Les lancements manuels envoient de vrais emails">
                <p>
                  L’étape « Contrats » peut envoyer le mail « club des 99 % » et l’étape « Factures » prévient les
                  conseillers de leurs nouvelles factures, exactement comme la nuit.
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── Emails */}
            <Section id="emails" titre="Page Emails" icone={Mail}>
              <p>
                Elle permet de choisir, pour chacun des quatre emails envoyés par l’application, qui le reçoit et qui est
                en copie, <strong>sans faire appel à Thibault</strong>.
              </p>
              <Definitions
                colonnes={["Email", "Qui le reçoit"]}
                lignes={[
                  ["Invitation à activer son espace", "Le conseiller invité. Vous réglez les copies."],
                  ["Nouvelle facture créée", "Le conseiller concerné, une fois par facture créée la nuit. Vous réglez les copies."],
                  ["Facture envoyée à l’administration", "Les destinataires que vous listez. Vous réglez aussi les copies."],
                  ["Club des 99 %", "Le conseiller qui franchit les 70 000 €. Vous réglez les copies."],
                ]}
              />
              <p>
                Quand l’email s’adresse à un conseiller, c’est toujours lui qui le reçoit : l’application le détermine
                seule, vous ne pouvez qu’ajouter des personnes en copie. Seul l’email « Facture envoyée à
                l’administration » a une liste de destinataires, qui est entièrement entre vos mains.
              </p>
              <p>
                Saisissez une adresse puis <Ui>Ajouter</Ui>. Chaque adresse enregistrée peut ensuite être corrigée ou
                retirée. Un changement s’applique aux emails envoyés dans la minute qui suit.
              </p>
              <Encart ton="attention" titre="Une liste vide n’est pas une liste sans destinataire">
                <p>
                  Tant qu’aucune adresse n’est enregistrée pour les destinataires de « Facture envoyée à
                  l’administration » ou pour les copies de « Club des 99 % », ce sont les adresses de la configuration du
                  serveur qui s’appliquent. La page les affiche sous la liste. Dès que vous ajoutez une adresse, seules les
                  adresses enregistrées comptent. Si vous retirez la dernière, la configuration du serveur reprend la main.
                </p>
              </Encart>
              <Encart ton="astuce" titre="Avant de retirer une adresse de l’administration">
                <p>
                  Vérifiez qu’il reste au moins une personne destinataire des factures envoyées : c’est par cet email que
                  vous savez qu’une facture est à régler.
                </p>
              </Encart>
            </Section>

            {/* ───────────────────────────── FAQ */}
            <Section id="faq" titre="Questions fréquentes" icone={CircleHelp}>
              <div className="space-y-2">
                <Question question="Pourquoi une facture n’a-t-elle pas de numéro ?">
                  <p>
                    C’est le conseiller qui renseigne le numéro, dans la fenêtre « Informations à renseigner » de son
                    espace. Tant qu’il ne l’a pas fait, la facture est affichée « À attribuer » et il ne peut pas l’envoyer.
                  </p>
                </Question>
                <Question question="Une vente est dans Apimo mais le conseiller n’a pas de facture">
                  <p>
                    Vérifiez d’abord que la vente est bien clôturée dans Apimo, puis que les passages de la nuit sont en
                    succès dans <Ui>Synchronisations</Ui>. Une vente clôturée depuis plus de 7 jours sans facture, ou un
                    passage en échec qui persiste : prévenez Thibault.
                  </p>
                </Question>
                <Question question="Le chiffre d’affaires d’un conseiller semble faux">
                  <p>
                    Il se recalcule chaque nuit d’après les honoraires Apimo. Vérifiez les honoraires de ses ventes dans
                    Apimo ; ne corrigez pas le chiffre à la main dans l’application, la prochaine nuit l’écraserait.
                  </p>
                </Question>
                <Question question="Peut-on supprimer une facture ?">
                  <p>
                    Non : on garde la trace de tout. Une facture jamais envoyée s’annule (et se remplace) ; une facture
                    émise se corrige par un avoir.
                  </p>
                </Question>
                <Question question="Pourquoi le montant de la liste diffère-t-il de celui du PDF ?">
                  <p>
                    La liste affiche la rétrocession HT avant déduction de l’apporteur d’affaire. Le PDF donne le montant
                    réellement dû.
                  </p>
                </Question>
                <Question question="Une collègue doit recevoir les factures envoyées par les conseillers">
                  <p>
                    Dans <Ui>Emails</Ui>, ajoutez son adresse aux destinataires de « Facture envoyée à
                    l’administration », ou en copie si elle doit seulement être tenue informée.
                  </p>
                </Question>
                <Question question="Un conseiller a changé de société de facturation ou d’email de facturation">
                  <p>
                    Dans <Ui>Paramètres conseillers</Ui>, onglet « Facturation recrutement » (le conseiller peut aussi le
                    faire dans « Mon compte »). Le changement s’applique aux factures de recrutement et aux avoirs sur
                    recrutement, y compris à ceux déjà émis quand on rouvre leur PDF.
                  </p>
                </Question>
              </div>
              <Encart titre="Quand prévenir Thibault ?">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Une synchronisation reste en échec après une relance.</li>
                  <li>Une facture attendue manque, ou un montant HT est faux.</li>
                  <li>Un parrainage a été renseigné après coup et des factures de recrutement manquent.</li>
                  <li>Un comportement de l’application vous surprend, ou vous avez un doute avant d’agir sur une facture émise.</li>
                </ul>
              </Encart>
            </Section>

            {/* ───────────────────────────── Glossaire */}
            <Section id="glossaire" titre="Glossaire" icone={Languages}>
              <Definitions
                colonnes={["Terme", "Définition"]}
                lignes={[
                  ["Apimo", "Le logiciel métier des agences, où sont saisis les ventes, les conseillers et les mandats."],
                  ["Mandat", "L’engagement signé pour vendre un bien ; son numéro identifie la vente."],
                  ["Honoraires (HT)", "La rémunération de Youlive sur la vente, hors taxes."],
                  ["Rétrocession", "La part des honoraires reversée au conseiller (70 %, 60 % ou 99 % selon sa situation)."],
                  ["Seuil des 70 000 €", "Chiffre d’affaires annuel à partir duquel le conseiller passe à 99 % de rétrocession."],
                  ["Tranche", "Une commission coupée au seuil donne une facture « avant seuil » et une « après seuil »."],
                  ["Parrain, filleul, niveau", "Un conseiller parrain perçoit une part des ventes de ses filleuls sur trois niveaux."],
                  ["Auto-parrainage", "Option qui ajoute 6 points de rétrocession."],
                  ["Apporteur d’affaire", "Personne ayant apporté la vente, rémunérée sur la facture du conseiller."],
                  ["Avoir", "Document de montant négatif qui annule une facture émise."],
                  ["Ajustement", "Document de montant positif qui verse un complément."],
                  ["Société de facturation", "La société qui émet les factures de recrutement d’un conseiller, quand elle diffère de lui."],
                  ["Club des 99 %", "Mail envoyé au conseiller le jour où il franchit les 70 000 € de chiffre d’affaires."],
                ]}
              />
            </Section>

            <p className="border-t border-gray-100 pt-5 text-xs text-gray-400">
              Documentation rédigée le 15/10/2026, mise à jour le 26/10/2026. Si l’application et ce document ne disent pas la même chose, c’est le
              document qui est à mettre à jour : signalez-le à Thibault.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
