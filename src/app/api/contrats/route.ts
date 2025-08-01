import prisma from "@/lib/db";
import { Contract, Entries } from "@/lib/types";
import { NextResponse } from "next/server";
import { calculRetrocession } from "@/utils/calculs";

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
      const { id, step, property, commission_agency, contract_at, entries } =
        contrat;

      // Validation des champs principaux
      if (!id || !step || !property || !commission_agency || !contract_at) {
        console.log(
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
            honoraires: Number(commission_agency),
            date_signature: new Date(contract_at),
          },
          create: {
            idcontratapimo: Number(id),
            statut: step,
            property_id: Number(property),
            honoraires: Number(commission_agency),
            date_signature: new Date(contract_at),
          },
        });

        insertedContracts.push(createdContrat);

        // Trier les entries pour avoir les type 2, donc apporteur d'affaire, en premier
        const sortEntries = entries?.sort(
          (a: Entries, b: Entries) =>
            Number(b.type === "2") - Number(a.type === "2") ||
            Number(a.type === "9") - Number(b.type === "9")
        );

        // Gérer les relations (entries)
        if (sortEntries && Array.isArray(sortEntries)) {
          for (const entry of sortEntries) {
            const { id, user, amount, vat, vat_rate, type } = entry;

            if (!id || !user || !amount || !vat || !vat_rate) {
              continue;
            }

            // Trouver l'utilisateur correspondant
            const utilisateur = await prisma.utilisateurs.findFirst({
              where: { idapimo: Number(user) },
              select: {
                id: true,
                chiffre_affaires: true,
                typecontrat: true,
                auto_parrain: true,
              },
            });

            if (!utilisateur) {
              continue;
            }

            // Créer la relation si elle n'existe pas
            const relationResult = await prisma.relations_contrats.upsert({
              where: {
                idrelationapimo: Number(id),
              },
              update: {
                honoraires_agent: Number(amount),
                vat: Number(vat),
                vat_rate: Number(vat_rate),
              },
              create: {
                idrelationapimo: Number(id),
                contrat_id: createdContrat.id,
                user_id: utilisateur.id,
                honoraires_agent: Number(amount),
                vat: Number(vat),
                vat_rate: Number(vat_rate),
              },
            });

            // Mise à jour du chiffre d'affaires uniquement pour les conseillers (type 9) et pour les nouvelles relations
            if (type === "9" && relationResult) {
              // Vérifier si c'est une création ou une mise à jour
              const isNewRelation = !(await prisma.relations_contrats.findFirst({
                where: {
                  contrat_id: createdContrat.id,
                  user_id: utilisateur.id,
                  created_at: {
                    lt: new Date(new Date().getTime() - 5000), // Créé il y a plus de 5 secondes
                  },
                },
              }));

              if (isNewRelation) {
                const currentCA = Number(utilisateur.chiffre_affaires || 0);
                const honorairesAgent = Number(amount); // On prend uniquement le montant de l'entry
                const newCA = currentCA + honorairesAgent;

                // Calculer la nouvelle rétrocession en fonction du nouveau chiffre d'affaires
                const newRetrocession = calculRetrocession(
                  utilisateur.typecontrat || "",
                  newCA,
                  utilisateur.auto_parrain || undefined
                );

                await prisma.utilisateurs.update({
                  where: { id: utilisateur.id },
                  data: { 
                    chiffre_affaires: newCA,
                    retrocession: newRetrocession
                  },
                });

                console.log(
                  `✅ Chiffre d'affaires et rétrocession mis à jour pour l'utilisateur ${utilisateur.id}: CA ${currentCA} → ${newCA} (+${honorairesAgent}), Rétrocession → ${newRetrocession}%`
                );
              }
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
      data: filteredContracts,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des contrats :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
