import { NextResponse } from "next/server";
import path from "path";
import { getFactureById } from "@/backend/gestionFactures";

export default async function POST(req: Request) {
  try {
    const body = await req.json();
    const factureId = body.id;

    if (!factureId) {
      return NextResponse.json(
        { error: "L'ID de la facture est requis." },
        { status: 400 }
      );
    }

    const facture = await getFactureById(factureId);

    if (!facture) {
      return NextResponse.json(
        { error: "Facture introuvable." },
        { status: 404 }
      );
    }

    const pdfPath = path.join(
      process.cwd(),
      "public",
      "pdf",
      `facture-${factureId}.pdf`
    );
    await generatePdf(facture, pdfPath);

    const pdfUrl = `/pdf/facture-${factureId}.pdf`;
    return NextResponse.json({ url: pdfUrl });
  } catch (error) {
    console.error("Erreur lors de la création du PDF :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
