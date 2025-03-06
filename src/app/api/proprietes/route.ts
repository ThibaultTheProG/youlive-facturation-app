import prisma from "@/lib/db";
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
    try {
      for (const property of allProperties) {
        const { id, address, reference, city } = property;

        // Conversion des valeurs
        const idNumber = Number(id);
        const ville = city?.name ?? "";
        const cp = city?.zipcode ?? "";
        const referenceString = String(reference);

        // Concaténer l'adresse complète
        const fullAddress = `${address}, ${cp} ${ville}`.trim();

        // Vérification de l'existence du contrat
        const contrat = await prisma.contrats.findFirst({
          where: {
            property_id: idNumber
          },
          select: {
            id: true
          }
        });

        if (contrat) {
          // Insertion ou mise à jour de la propriété avec l'adresse complète
          await prisma.property.upsert({
            where: {
              contrat_id: contrat.id
            },
            update: {
              adresse: fullAddress,
              numero_mandat: referenceString
            },
            create: {
              adresse: fullAddress,
              numero_mandat: referenceString,
              contrat_id: contrat.id
            }
          });
        }
      }
      console.log("✅ Propriétés insérées ou mises à jour avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de l'insertion des propriétés :", error);
      throw error;
    }

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