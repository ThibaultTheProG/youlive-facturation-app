import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import db from "@/lib/db";

const passwordSchema = z.object({
  conseillerId: z.string().min(1, "Veuillez sélectionner un conseiller."),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData(); // Récupérer les données du formulaire
    const body = Object.fromEntries(formData.entries()); // Convertir en objet
    const { conseillerId, password } = passwordSchema.parse(body); // Validation avec Zod

    const hashedPassword = await hashPassword(password);

    const query = `
      UPDATE utilisateurs
      SET "motDePasse" = $1
      WHERE idapimo = $2;
    `;

    const client = await db.connect();

    try {
      await client.query(query, [hashedPassword, conseillerId]);
    } finally {
      client.release();
    }

    // Construire une URL absolue pour la redirection
    const redirectUrl = new URL("/login", request.url);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Erreur lors de l'attribution du mot de passe :", error);
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.errors : "Erreur serveur." },
      { status: 400 }
    );
  }
}