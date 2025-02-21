import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const query = `
      SELECT 
        f.id,
        f.user_id,
        f.type,
        f.retrocession,
        f.statut_paiement,
        f.created_at,
        f.numero,
        u.prenom,
        u.nom
      FROM factures f
      JOIN utilisateurs u ON f.user_id = u.id
      ORDER BY f.created_at DESC;
    `;

    const result = await db.query(query);

    return NextResponse.json(
      result.rows.map((facture) => ({
        ...facture,
        conseiller: {
          prenom: facture.prenom,
          nom: facture.nom,
        },
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des factures :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
