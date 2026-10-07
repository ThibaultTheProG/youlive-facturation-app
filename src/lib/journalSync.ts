import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { User } from "@/lib/auth";
import {
  DELAI_INTERRUPTION_MS,
  definitionSync,
  type StatutSyncStocke,
  type TypeSync,
} from "@/lib/synchronisations";

/**
 * Journal des synchronisations (table `synchronisations`), lu par la page
 * `/admin/synchronisations`.
 *
 * Toute route de synchronisation passe par `journaliserSync` : c'est ce qui
 * rend visibles à l'administration les passages nocturnes comme les lancements
 * manuels, et ce qui interdit deux exécutions simultanées du même type.
 */

/** Remis à la route pour qu'elle consigne l'erreur réelle, que sa réponse HTTP ne détaille pas. */
export interface JournalSync {
  echec(erreur: unknown): void;
}

const LONGUEUR_MAX_ERREUR = 2000;

function messageErreur(erreur: unknown): string {
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  return message.trim().slice(0, LONGUEUR_MAX_ERREUR);
}

/** Les compteurs de la réponse, sans ce qui relève de l'enveloppe HTTP. */
function extraireResume(corps: unknown): Record<string, unknown> | null {
  if (!corps || typeof corps !== "object" || Array.isArray(corps)) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { success, message, error, duree_ms, ...resume } = corps as Record<
    string,
    unknown
  >;
  return Object.keys(resume).length > 0 ? resume : null;
}

/**
 * Exécute une synchronisation en la consignant.
 *
 * @param auth     retour de `requireCronOrAdmin` : `user` nul pour le cron
 * @param executer la synchronisation, qui renvoie sa réponse HTTP habituelle
 *
 * Répond `409` sans rien exécuter si une synchronisation du même type tourne
 * déjà. Une écriture de journal qui échoue n'interrompt jamais la
 * synchronisation : mieux vaut une sync non consignée qu'une sync non faite.
 */
export async function journaliserSync(
  type: TypeSync,
  auth: { user: User | null },
  executer: (journal: JournalSync) => Promise<NextResponse>
): Promise<NextResponse> {
  let id: number | null = null;

  try {
    const enCours = await prisma.synchronisations.findFirst({
      where: {
        type,
        statut: "en_cours",
        debut: { gte: new Date(Date.now() - DELAI_INTERRUPTION_MS) },
      },
      select: { id: true },
    });
    if (enCours) {
      return NextResponse.json(
        {
          error: `La synchronisation « ${
            definitionSync(type)?.libelle ?? type
          } » est déjà en cours.`,
        },
        { status: 409 }
      );
    }

    const ligne = await prisma.synchronisations.create({
      data: {
        type,
        declencheur: auth.user ? "manuel" : "cron",
        auteur_id: auth.user?.id ?? null,
        debut: new Date(),
        statut: "en_cours",
      },
      select: { id: true },
    });
    id = ligne.id;
  } catch (erreur) {
    console.error(`Journal de synchronisation (${type}) : ouverture impossible`, erreur);
  }

  let erreurConsignee: string | null = null;
  const journal: JournalSync = {
    echec: (erreur) => {
      erreurConsignee = messageErreur(erreur);
    },
  };

  const cloturer = async (
    statut: StatutSyncStocke,
    resume: Record<string, unknown> | null,
    erreur: string | null
  ) => {
    if (id === null) return;
    try {
      await prisma.synchronisations.update({
        where: { id },
        data: {
          fin: new Date(),
          statut,
          resume: resume ? (resume as object) : undefined,
          erreur,
        },
      });
    } catch (e) {
      console.error(`Journal de synchronisation (${type}) : clôture impossible`, e);
    }
  };

  let reponse: NextResponse;
  try {
    reponse = await executer(journal);
  } catch (erreur) {
    await cloturer("echec", null, messageErreur(erreur));
    throw erreur;
  }

  const corps = await reponse
    .clone()
    .json()
    .catch(() => null);
  const resume = extraireResume(corps);

  if (erreurConsignee !== null || !reponse.ok) {
    await cloturer(
      "echec",
      resume,
      erreurConsignee ?? messageErreur(corps?.error ?? `Erreur HTTP ${reponse.status}`)
    );
  } else {
    await cloturer(
      Number(resume?.erreurs) > 0 ? "avec_erreurs" : "succes",
      resume,
      null
    );
  }

  return reponse;
}
