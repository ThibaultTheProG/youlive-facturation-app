import { generateToken } from "@/lib/auth";
import { comparePassword } from "@/lib/password";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

const ECHEC_CONNEXION = "Email ou mot de passe incorrect.";
/** Hash bcrypt (coût 12) d'une valeur sans compte, comparé quand l'email est inconnu. */
const HASH_LEURRE = "$2a$12$Gh3CTVeNHLxgKWUKHkqPd.95B0Toh6ztcaS5X6JXL7GwaIYpPRklW";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur avec Prisma
    const user = await prisma.utilisateurs.findFirst({
      where: { 
        email,
        motDePasse: { not: null },
        role: { not: null },
        // Un compte désactivé ne se connecte plus. Même réponse qu'un email
        // inconnu : la désactivation n'a pas à être révélée.
        actif: true
      },
      select: {
        id: true,
        motDePasse: true,
        role: true,
        nom: true,
        prenom: true
      }
    });

    // Même réponse pour un email inconnu, un compte désactivé ou un mauvais mot de
    // passe : distinguer les cas révélait quels emails ont un compte.
    if (!user) {
      // Un bcrypt factice, pour que le temps de réponse ne trahisse pas non plus
      // l'absence de compte (sans lui, la réponse revenait ~250 ms plus tôt).
      await comparePassword(password, HASH_LEURRE);
      return NextResponse.json({ error: ECHEC_CONNEXION }, { status: 401 });
    }

    const { id, motDePasse: hashedPassword, role } = user;
    const name = `${user.prenom} ${user.nom}`.trim();

    const isValid = await comparePassword(password, hashedPassword as string);

    if (!isValid) {
      return NextResponse.json({ error: ECHEC_CONNEXION }, { status: 401 });
    }

    // Générer un token JWT
    const token = await generateToken({ id, role: role as "admin" | "conseiller", name, email });
   

    // Stocker le token dans un cookie sécurisé
    const response = NextResponse.json({
      message: "Connexion réussie",
      role,
    });

    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Explicite plutôt que de dépendre du défaut du framework.
      // `lax` et non `strict` : les emails de facture contiennent un lien vers
      // `/factures/[id]/pdf` — en `strict` le cookie ne serait pas envoyé lors
      // de ce clic depuis la boîte mail et l'utilisateur serait renvoyé au
      // login. `lax` conserve le blocage des requêtes mutantes cross-site.
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 heure
    });

    return response;
  } catch (error) {
    console.error("Erreur serveur :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}