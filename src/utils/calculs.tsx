export const calculRetrocession = (
  typecontrat: string,
  chiffre_affaires: number
): number => {
  let retrocession = 0;

  switch (typecontrat) {
    case "Offre Youlive":
      retrocession = chiffre_affaires > 70000 ? 99 : 70;
      break;
    case "Offre Découverte":
      retrocession = chiffre_affaires > 70000 ? 99 : 60;
      break;
    default:
        retrocession = 0;
  }

  return retrocession;
};
