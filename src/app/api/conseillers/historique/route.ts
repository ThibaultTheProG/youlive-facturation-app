import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

const LIMITE = 500;

export type EvenementHistorique = {
  id: string;
  date: string;
  operation: string;
  /** Nom de colonne de `utilisateurs`, ou `parrainage` pour la chaîne de parrains. */
  champ: string | null;
  avant: string | null;
  apres: string | null;
  auteur: string | null;
  /** Voir `SOURCES_UTILISATEUR` ; nul = écriture hors de l'app (SQL, script). */
  source: string | null;
};

/**
 * Historique des modifications d'un conseiller : `utilisateurs_historique` (une ligne par
 * champ modifié) et `parrainages_historique`, fusionnés par date décroissante.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Le paramètre id est requis" }, { status: 400 });
  }

  try {
    const [fiche, parrainages] = await Promise.all([
      prisma.utilisateurs_historique.findMany({
        where: { user_id: id },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: LIMITE,
      }),
      prisma.parrainages_historique.findMany({
        where: { user_id: id },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: LIMITE,
      }),
    ]);

    // Noms des auteurs et des parrains cités, en une seule requête.
    const ids = new Set<number>();
    for (const l of fiche) if (l.auteur_id) ids.add(l.auteur_id);
    for (const l of parrainages) {
      if (l.auteur_id) ids.add(l.auteur_id);
      for (const n of [
        l.niveau1_avant, l.niveau2_avant, l.niveau3_avant,
        l.niveau1_apres, l.niveau2_apres, l.niveau3_apres,
      ]) {
        if (n) ids.add(n);
      }
    }
    const personnes = await prisma.utilisateurs.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, prenom: true, nom: true },
    });
    const nom = (n: number | null) => {
      if (!n) return null;
      const p = personnes.find((x) => x.id === n);
      return p ? `${p.prenom ?? ""} ${p.nom ?? ""}`.trim() : `#${n}`;
    };
    const chaine = (a: number | null, b: number | null, c: number | null) =>
      `N1 : ${nom(a) ?? "Aucun"} · N2 : ${nom(b) ?? "Aucun"} · N3 : ${nom(c) ?? "Aucun"}`;

    const evenements: EvenementHistorique[] = [
      ...fiche.map((l) => ({
        id: `u${l.id}`,
        date: l.created_at.toISOString(),
        operation: l.operation,
        champ: l.champ,
        avant: l.avant,
        apres: l.apres,
        auteur: nom(l.auteur_id),
        source: l.source,
      })),
      ...parrainages.map((l) => ({
        id: `p${l.id}`,
        date: l.created_at.toISOString(),
        operation: l.operation,
        champ: "parrainage",
        avant:
          l.operation === "INSERT"
            ? null
            : chaine(l.niveau1_avant, l.niveau2_avant, l.niveau3_avant),
        apres:
          l.operation === "DELETE"
            ? null
            : chaine(l.niveau1_apres, l.niveau2_apres, l.niveau3_apres),
        auteur: nom(l.auteur_id),
        source: l.source,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, LIMITE);

    return NextResponse.json({ evenements });
  } catch (error) {
    console.error("Erreur lors de la lecture de l'historique du conseiller :", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture de l'historique" },
      { status: 500 }
    );
  }
}
