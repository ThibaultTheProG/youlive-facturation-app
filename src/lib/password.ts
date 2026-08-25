import bcryptjs from "bcryptjs";

/**
 * Hachage / vérification de mot de passe — **serveur uniquement**.
 *
 * Ces fonctions passaient auparavant par `POST /api/auth/hash` dès qu'elles
 * étaient appelées côté navigateur. Cette route était publique et exposait un
 * oracle bcrypt (hash + compare sans authentification) : elle a été supprimée.
 * Aucun composant client n'utilisait cette branche — seules les routes
 * `auth/login`, `auth/invitation`, `auth/set-password` et `change-password`
 * importent ce module.
 */
/**
 * Coût bcrypt. Passé de 10 à 12 : le facteur de travail est stocké dans le hash
 * lui-même, donc `compareSync` continue de valider sans migration les mots de
 * passe déjà hachés en coût 10 — ils seront réhachés en 12 au prochain
 * changement de mot de passe.
 */
const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  const salt = bcryptjs.genSaltSync(BCRYPT_COST);
  return bcryptjs.hashSync(password, salt);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compareSync(password, hash);
}
