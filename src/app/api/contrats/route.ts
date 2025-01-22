import {
  insertContrats,
} from "@/backend/gestionContrats";
import { Contract } from "@/lib/types";


export async function GET() {
  try {
    // Appel à l'API Apimo
    const response = await fetch(
      "https://api.apimo.pro/agencies/24045/contracts",
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
        JSON.stringify({ error: "Échec de la récupération des contrats" }),
        { status: response.status }
      );
    }

    // Extraction et filtrage des contrats
    const brut = await response.json();
    const contracts: Contract[] = brut.contracts || [];
    const filteredContracts = contracts.filter(
      (contract) => contract.step === "4"
    );
    // Insérer les contrats et créer les relations
    await insertContrats(filteredContracts);

    return new Response(JSON.stringify({ data: filteredContracts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des contrats :", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500 }
    );
  }
}
