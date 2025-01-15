import { NextResponse } from "next/server";
import createFactures from "@/backend/gestionFactures";

export async function GET() {
  try {
    // Appeler la fonction createFactures
    await createFactures();
    console.log("Factures générées avec succès.");
    return NextResponse.json({ message: "Factures générées avec succès." });
  } catch (error) {
    console.error("Erreur lors de la génération des factures :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
