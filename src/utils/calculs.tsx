export const calculRetrocession = (
  typecontrat: string,
  chiffre_affaires: number,
  autoParrain?: string
): number => {
  let retrocession = 0;

  switch (typecontrat) {
    case "Offre Youlive":
      retrocession = chiffre_affaires >= 70000 ? 99 : 70;
      break;
    case "Offre Découverte":
      retrocession = chiffre_affaires >= 70000 ? 99 : 60;
      break;
    default:
      retrocession = 0;
  }

  // Appliquer le bonus d'auto-parrainage
  if (autoParrain === "oui") {
    retrocession += 6;
  }

  console.log(retrocession);

  // S'assurer que la rétrocession ne dépasse pas 99%
  return Math.min(retrocession, 99);
};