const EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** 1234.5 → « 1 234,50 € ». Accepte un nombre ou une chaîne numérique ; le reste vaut 0. */
export function formatEuros(valeur: string | number | null | undefined): string {
  const n = Number(valeur ?? 0);
  return EUROS.format(Number.isFinite(n) ? n : 0);
}

/** Date ISO → « 14/10/2026 », ou un tiret quand elle manque. */
export function formatDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}
