export async function getConseillersAPI() {
  try {
    const response = await fetch("https://api.apimo.pro/agencies/24045/users", {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.USERNAME}:${process.env.PASSWORD}`
        ).toString("base64")}`,
        cache: "force-cache",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des conseillers");
    }

    const data = await response.json();
    return data.users; // Contient la liste des conseillers
  } catch (error) {
    console.error("Erreur :", error);
    return [];
  }
}