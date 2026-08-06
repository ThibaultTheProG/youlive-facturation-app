/**
 * Accès à l'API Apimo pour les synchronisations nocturnes.
 *
 * Point critique : les endpoints Apimo sont **paginés et plafonnés à 10 000
 * éléments par requête**. Un `fetch` sans `limit`/`offset` tronque donc
 * silencieusement dès que la ressource dépasse ce seuil — c'est ce qui se
 * produisait sur `contacts` (14 583 éléments, 10 000 récupérés). Toujours
 * passer par `fetchApimoAll`, qui déroule les pages jusqu'à `total_items`.
 */

const BASE_URL = "https://api.apimo.pro/agencies/24045";
const PAGE_SIZE = 1000;
/** Garde-fou : 100 pages × 1000 = 100 000 éléments, très au-delà des volumes réels. */
const MAX_PAGES = 100;

export class ApimoError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApimoError";
    this.status = status;
  }
}

function authorization(): string {
  return `Basic ${Buffer.from(
    `${process.env.USERNAME}:${process.env.PASSWORD}`
  ).toString("base64")}`;
}

/**
 * Récupère la totalité d'une ressource Apimo en déroulant la pagination.
 *
 * @param ressource chemin relatif, query string éventuelle incluse (ex. `properties?status[]=30`)
 * @param cle       clé du tableau dans la réponse JSON (ex. `contracts`)
 */
export async function fetchApimoAll<T>(
  ressource: string,
  cle: string
): Promise<T[]> {
  const separateur = ressource.includes("?") ? "&" : "?";
  const items: T[] = [];
  let total = Infinity;
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${BASE_URL}/${ressource}${separateur}limit=${PAGE_SIZE}&offset=${offset}`;
    const response = await fetch(url, {
      headers: { Authorization: authorization() },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ApimoError(
        `Échec de la récupération Apimo (${ressource}, offset ${offset})`,
        response.status
      );
    }

    const json = await response.json();
    const lot: T[] = json[cle] ?? [];
    items.push(...lot);

    if (Number.isFinite(Number(json.total_items))) {
      total = Number(json.total_items);
    }

    // Page vide ou incomplète : plus rien à récupérer
    if (lot.length === 0 || lot.length < PAGE_SIZE || items.length >= total) {
      break;
    }
    offset += lot.length;
  }

  if (Number.isFinite(total) && items.length < total) {
    console.warn(
      `⚠️ Apimo ${ressource} : ${items.length} éléments récupérés sur ${total} annoncés`
    );
  }

  return items;
}
