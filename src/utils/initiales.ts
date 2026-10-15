/** « Marie Dupont » → « MD ». Un seul mot : sa première lettre. Rien : « ? ». */
export function initiales(nom: string | undefined | null): string {
  const mots = (nom ?? "").trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "?";
  return (mots[0][0] + (mots.length > 1 ? mots[mots.length - 1][0] : "")).toUpperCase();
}
