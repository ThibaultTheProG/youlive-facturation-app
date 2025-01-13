import { cookies } from "next/headers"; // Pour accéder aux cookies
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    // Accéder aux cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value; // Récupérer la valeur du cookie "authToken"

    if (!token) {
      return NextResponse.json(
        { error: "Token not found" },
        { status: 401 }
      );
    }

    // Vérifier le token JWT
    const user = await verifyToken(token);

    if (!user || typeof user !== "object" || !("id" in user)) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Retourner uniquement les informations nécessaires
    const { id, email, role } = user;

    return NextResponse.json({ id, email, role });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des cookies ou de l'authentification :",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}