import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";
import {
  DELAI_INTERRUPTION_MS,
  SYNCHRONISATIONS,
  estTypeSync,
  type StatutSync,
} from "@/lib/synchronisations";

export const dynamic = "force-dynamic";

const PAR_PAGE = 20;

const SELECTION = {
  id: true,
  type: true,
  declencheur: true,
  debut: true,
  fin: true,
  statut: true,
  resume: true,
  erreur: true,
  utilisateurs: { select: { prenom: true, nom: true } },
} as const;

type Ligne = {
  id: number;
  type: string;
  declencheur: string;
  debut: Date;
  fin: Date | null;
  statut: string;
  resume: unknown;
  erreur: string | null;
  utilisateurs: { prenom: string | null; nom: string | null } | null;
};

/** Journal des synchronisations : dernier passage de chaque type, et historique paginé. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const type = params.get("type");
  const statut = params.get("statut");

  // Une ligne `en_cours` trop ancienne est une exécution tuée (timeout) : elle
  // est lue, et filtrée, comme « interrompue ».
  const maintenant = Date.now();
  const seuil = new Date(maintenant - DELAI_INTERRUPTION_MS);

  const where = {
    ...(estTypeSync(type) ? { type } : {}),
    ...(statut === "interrompue"
      ? { statut: "en_cours", debut: { lt: seuil } }
      : statut === "en_cours"
        ? { statut: "en_cours", debut: { gte: seuil } }
        : statut
          ? { statut }
          : {}),
  };

  const presenter = (ligne: Ligne) => {
    const statutLu: StatutSync =
      ligne.statut === "en_cours" && ligne.debut < seuil
        ? "interrompue"
        : (ligne.statut as StatutSync);
    return {
      id: ligne.id,
      type: ligne.type,
      declencheur: ligne.declencheur,
      auteur: ligne.utilisateurs
        ? [ligne.utilisateurs.prenom, ligne.utilisateurs.nom].filter(Boolean).join(" ")
        : null,
      debut: ligne.debut,
      fin: ligne.fin,
      duree_ms: ligne.fin ? ligne.fin.getTime() - ligne.debut.getTime() : null,
      statut: statutLu,
      resume: ligne.resume,
      erreur: ligne.erreur,
    };
  };

  try {
    const [lignes, total, derniers] = await Promise.all([
      prisma.synchronisations.findMany({
        where,
        select: SELECTION,
        orderBy: { debut: "desc" },
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
      }),
      prisma.synchronisations.count({ where }),
      Promise.all(
        SYNCHRONISATIONS.map(({ type }) =>
          prisma.synchronisations.findFirst({
            where: { type },
            select: SELECTION,
            orderBy: { debut: "desc" },
          })
        )
      ),
    ]);

    return NextResponse.json({
      lignes: lignes.map(presenter),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / PAR_PAGE)),
      derniers: Object.fromEntries(
        SYNCHRONISATIONS.map(({ type }, index) => [
          type,
          derniers[index] ? presenter(derniers[index]) : null,
        ])
      ),
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du journal des synchronisations :", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du journal des synchronisations" },
      { status: 500 }
    );
  }
}
