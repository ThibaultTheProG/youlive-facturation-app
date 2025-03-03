import { NextResponse } from "next/server";
import bcryptjs from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { password, action, hash } = await request.json();

    if (action === 'hash') {
      const salt = bcryptjs.genSaltSync(10);
      const hashedPassword = bcryptjs.hashSync(password, salt);
      return NextResponse.json({ hash: hashedPassword });
    }

    if (action === 'compare') {
      const isValid = bcryptjs.compareSync(password, hash);
      return NextResponse.json({ isValid });
    }

    return NextResponse.json(
      { error: "Action non valide" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors de l'exécution de la route :", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}