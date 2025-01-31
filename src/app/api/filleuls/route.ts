import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  const client = await db.connect(); // 🔗 Connexion à la BDD

  try {
    // Récupérer l'ID du conseiller depuis l'URL
    const url = new URL(req.url);
    const conseillerId = Number(url.searchParams.get("conseillerId"));

    // Vérifier si conseillerId est un nombre valide
    if (isNaN(conseillerId) || conseillerId <= 0) {
      return NextResponse.json(
        { error: "ID du conseiller invalide" },
        { status: 400 }
      );
    }

    // 🔍 Requête SQL optimisée pour trouver les filleuls via la table "utilisateurs" et "parrainages"
    const query = `
      SELECT DISTINCT 
    u.id, 
    u.prenom, 
    u.nom, 
    u.chiffre_affaires, 
    COALESCE(p.niveau, 1) AS niveau -- Niveau = 1 pour les filleuls directs, sinon prendre la valeur de parrainages
FROM utilisateurs u
LEFT JOIN parrainages p ON u.id = p.filleul_id AND p.parrain_id = $1
WHERE u.parrain_id = $1 OR p.parrain_id = $1;
    `;

    const result = await client.query(query, [conseillerId]);

    // 🔍 Debugging pour voir les résultats en console
    console.log(
      `✅ Filleuls trouvés pour le conseiller ${conseillerId} :`,
      result.rows
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des filleuls :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  } finally {
    client.release(); // 🔗 Toujours libérer la connexion après usage
  }
}
