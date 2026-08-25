import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import prisma from "@/lib/db";

/**
 * Lien d'invitation « définir mon mot de passe ».
 *
 * Remplace l'ancien flux où l'admin saisissait un mot de passe qui était ensuite
 * envoyé en clair par email (`sendPasswordEmail`). Ici rien de secret ne transite :
 * l'email ne contient qu'un jeton signé, et c'est le conseiller qui choisit son
 * mot de passe.
 *
 * Usage unique sans table dédiée : le jeton embarque `k`, une empreinte du hash
 * de mot de passe au moment de l'émission. Dès que le mot de passe change,
 * l'empreinte ne correspond plus et le jeton est rejeté. Cela invalide donc
 * aussi automatiquement les invitations précédentes quand on en renvoie une.
 */
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
const DUREE = "48h";
const AUDIENCE = "set-password";

/** Empreinte courte du hash bcrypt courant (ou de son absence). */
function empreinte(motDePasse: string | null | undefined): string {
  return createHash("sha256")
    .update(motDePasse ?? "")
    .digest("hex")
    .slice(0, 32);
}

export async function createSetupToken(
  userId: number,
  motDePasseActuel: string | null | undefined
): Promise<string> {
  return new SignJWT({ uid: userId, k: empreinte(motDePasseActuel) })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(DUREE)
    .sign(SECRET_KEY);
}

export type SetupTokenResult =
  | { userId: number }
  | { erreur: "invalide" | "expire" | "deja_utilise" };

/**
 * Vérifie signature, audience, expiration, puis relit l'utilisateur en base pour
 * confirmer que le mot de passe n'a pas changé depuis l'émission du jeton.
 */
export async function verifySetupToken(
  token: string
): Promise<SetupTokenResult> {
  let uid: number;
  let k: string;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      audience: AUDIENCE,
    });
    uid = Number(payload.uid);
    k = String(payload.k ?? "");
    if (!Number.isInteger(uid) || uid <= 0 || !k) return { erreur: "invalide" };
  } catch (error) {
    const code = (error as { code?: string }).code;
    return { erreur: code === "ERR_JWT_EXPIRED" ? "expire" : "invalide" };
  }

  const utilisateur = await prisma.utilisateurs.findUnique({
    where: { id: uid },
    select: { motDePasse: true, actif: true },
  });

  if (!utilisateur || !utilisateur.actif) return { erreur: "invalide" };
  if (empreinte(utilisateur.motDePasse) !== k) return { erreur: "deja_utilise" };

  return { userId: uid };
}
