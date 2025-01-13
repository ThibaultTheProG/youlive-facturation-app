import insertContrats from "@/backend/gestionContrats";

interface Contract {
  id: string;
  step: string;
  agency: string;
  property: string;
  currency: string;
  price: string;
  price_net: string;
  commission: string;
  commission_agency: string;
  vat: string;
  vat_rate: string;
  // Ajoutez d'autres propriétés spécifiques si nécessaire
  [key: string]: string | number | null | undefined;
}

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
      (contract) => contract.step === "5"
    );

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
