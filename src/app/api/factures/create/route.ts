import { NextResponse } from "next/server";
import {createFacture} from "@/backend/gestionFactures";

export async function GET() {
  try {
    // Appeler la fonction createFactures
    await createFacture();
    console.log("Ok");
    return NextResponse.json({
      message: "Ok",
    });
  } catch (error) {
    console.error("Erreur lors de la génération des factures :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
