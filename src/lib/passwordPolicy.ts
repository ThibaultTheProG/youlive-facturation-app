/**
 * Politique de mot de passe, dans un module sans dépendance serveur : il est
 * importé aussi bien par les routes API que par les formulaires client, et
 * `src/lib/password.ts` tire `bcryptjs`, qu'on ne veut pas dans le bundle.
 *
 * S'applique à la définition d'un **nouveau** mot de passe
 * (`/api/auth/set-password`, `/api/change-password`). La validation du
 * formulaire de connexion reste volontairement à 6 : la relever empêcherait les
 * comptes existants dont le mot de passe fait 6 ou 7 caractères de se connecter.
 */
export const LONGUEUR_MIN_MOT_DE_PASSE = 8;

export const MESSAGE_LONGUEUR_MIN = `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`;
