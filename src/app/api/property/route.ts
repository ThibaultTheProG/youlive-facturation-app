import insertProperties from "@/backend/gestionProperty";

interface Property {
  id: string;
  propertyId: string;
  adress: string;
  // Ajoutez d'autres propriétés spécifiques si nécessaire
  [key: string]: string | number | null | undefined;
}

export async function GET() {
  try {
    // Appel à l'API Apimo
    const response = await fetch(
      "https://api.apimo.pro/agencies/24045/properties?status[]=30",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.USERNAME}:${process.env.PASSWORD}`
          ).toString("base64")}`,
          cache: "force-cache",
        },
      }
    );

    // Vérification de la réponse
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Échec de la récupération des propriétés" }),
        { status: response.status }
      );
    }

    // Extraction et filtrage des contrats
    const brut = await response.json();
    const properties: Property[] = brut.properties || [];

    await insertProperties(properties);
    return new Response(JSON.stringify({ data: properties }), {
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
