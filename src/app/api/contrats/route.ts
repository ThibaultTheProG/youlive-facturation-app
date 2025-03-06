import prisma from "@/lib/db";
import { Contract } from "@/lib/types";
import { NextResponse } from "next/server";

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
      return NextResponse.json(
        { error: "Échec de la récupération des contrats" },
        { status: response.status }
      );
    }

    // Extraction et filtrage des contrats
    const brut = await response.json();
    const contracts: Contract[] = brut.contracts || [];
    const filteredContracts = contracts.filter(
      (contract) => contract.step === "4"
    );

    console.log("Nombre de contrats filtrés:", filteredContracts.length);

    // Insérer les contrats directement avec Prisma
    const currentYear = new Date().getFullYear();
    const insertedContracts = [];

    for (const contrat of filteredContracts) {
      const {
        id,
        step,
        property,
        price,
        price_net,
        commission,
        contract_at,
        entries,
      } = contrat;

      // Validation des champs principaux
      if (
        !id ||
        !step ||
        !property ||
        !price ||
        !price_net ||
        !commission ||
        !contract_at
      ) {
        console.error(
          "Contrat invalide, certains champs requis sont manquants :",
          contrat
        );
        continue;
      }

      // Vérifier si le contrat appartient à l'année en cours
      const contractYear = new Date(contract_at).getFullYear();
      if (contractYear !== currentYear) {
        continue;
      }

      try {
        // Insérer ou mettre à jour le contrat
        const createdContrat = await prisma.contrats.upsert({
          where: {
            idcontratapimo: Number(id),
          },
          update: {
            statut: step,
            property_id: Number(property),
            price: Number(price),
            price_net: Number(price_net),
            honoraires: Number(commission),
            date_signature: new Date(contract_at),
          },
          create: {
            idcontratapimo: Number(id),
            statut: step,
            property_id: Number(property),
            price: Number(price),
            price_net: Number(price_net),
            honoraires: Number(commission),
            date_signature: new Date(contract_at),
          },
        });

        insertedContracts.push(createdContrat);

        // Gérer les relations (entries)
        if (entries && Array.isArray(entries)) {
          for (const entry of entries) {
            const { user, amount, vat, vat_rate } = entry;

            if (!user || !amount || !vat || !vat_rate) {
              continue;
            }

            // Trouver l'utilisateur correspondant
            const utilisateur = await prisma.utilisateurs.findFirst({
              where: { idapimo: Number(user) },
            });

            if (!utilisateur) {
              continue;
            }

            // Créer la relation si elle n'existe pas
            const relation = await prisma.relations_contrats.upsert({
              where: {
                contrat_id_user_id: {
                  contrat_id: createdContrat.id,
                  user_id: utilisateur.id,
                },
              },
              update: {
                honoraires_agent: Number(amount),
                vat: Number(vat),
                vat_rate: Number(vat_rate),
              },
              create: {
                contrat_id: createdContrat.id,
                user_id: utilisateur.id,
                honoraires_agent: Number(amount),
                vat: Number(vat),
                vat_rate: Number(vat_rate),
              },
            });

            // Mettre à jour le chiffre d'affaires si nouvelle relation
            if (relation) {
              await prisma.utilisateurs.update({
                where: { id: utilisateur.id },
                data: {
                  chiffre_affaires: {
                    increment: Number(amount),
                  },
                },
              });
            }
          }
        }

        // Gérer les contacts (si disponibles dans l'API)
        // @ts-expect-error - La propriété contacts n'est pas définie dans le type Contract
        if (contrat.contacts && Array.isArray(contrat.contacts)) {
          // @ts-expect-error - La propriété contacts n'est pas définie dans le type Contract
          for (const contact of contrat.contacts) {
            const { contact: contactId, type } = contact;

            // Ne pas insérer les contacts avec le type 3 ou 4
            if (!contactId || !type || type === "3" || type === "4") {
              continue;
            }

            await prisma.contacts_contrats.upsert({
              where: {
                contrat_id_contact_id: {
                  contrat_id: createdContrat.id,
                  contact_id: Number(contactId),
                },
              },
              update: {},
              create: {
                contrat_id: createdContrat.id,
                contact_id: Number(contactId),
                type: Number(type),
              },
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement du contrat:", error);
      }
    }

    console.log(`${insertedContracts.length} contrats insérés avec succès`);

    return NextResponse.json({ 
      success: true,
      message: `${insertedContracts.length} contrats insérés avec succès`,
      data: filteredContracts 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des contrats :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
