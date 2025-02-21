import insertProperties from "@/backend/gestionProperty";
import { Property } from "@/lib/types";

export async function GET() {
  try {
    // URLs des requêtes
    const urls = [
      "https://api.apimo.pro/agencies/24045/properties?status[]=30",
      "https://api.apimo.pro/agencies/24045/properties?status[]=39",
    ];

    // Exécution des requêtes en parallèle
    const responses = await Promise.all(
      urls.map((url) =>
        fetch(url, {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.USERNAME}:${process.env.PASSWORD}`
            ).toString("base64")}`,
            cache: "force-cache",
          },
        })
      )
    );

    // Vérification des réponses
    const invalidResponse = responses.find((response) => !response.ok);
    if (invalidResponse) {
      return new Response(
        JSON.stringify({
          error: "Échec de la récupération des propriétés",
        }),
        { status: invalidResponse.status }
      );
    }

    // Extraction et fusion des propriétés
    const allProperties: Property[] = (
      await Promise.all(responses.map((res) => res.json()))
    )
      .map((data) => data.properties || [])
      .flat();

    // Insertion des propriétés dans la base
    insertProperties(allProperties)
      .then(() => console.log("Propriétés insérées avec succès"))
      .catch((err) => console.error("Erreur d'insertion :", err));

    // Retourner les données au client
    return new Response(JSON.stringify({ data: allProperties }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés :", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500 }
    );
  }
}