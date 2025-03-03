"use server";

import prisma from "../lib/db";
import { Contract } from "@/lib/types";

export async function insertContrats(contrats: Contract[] | object) {
  if (!Array.isArray(contrats)) {
    throw new Error("Les données des contrats ne sont pas valides.");
  }

  console.log(
    "Début de l'insertion des contrats. Nombre de contrats:",
    contrats.length
  );

  try {
    for (const contrat of contrats) {
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

      console.log("Traitement du contrat:", {
        id,
        step,
        property,
        price,
        price_net,
        commission,
        contract_at,
      });

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
      const currentYear = new Date().getFullYear();
      const contractYear = new Date(contract_at).getFullYear();

      if (contractYear === currentYear) {
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

          console.log("Contrat créé/mis à jour avec succès:", createdContrat);

          // Gérer les relations (entries)
          if (entries && Array.isArray(entries)) {
            console.log(
              `Traitement de ${entries.length} relations pour le contrat ${id}`
            );

            for (const entry of entries) {
              const { user, amount, vat, vat_rate } = entry;

              if (!user || !amount || !vat || !vat_rate) {
                console.warn(
                  "Relation invalide, certains champs requis sont manquants :",
                  entry
                );
                continue;
              }

              // Trouver l'utilisateur correspondant
              const utilisateur = await prisma.utilisateurs.findFirst({
                where: { idapimo: Number(user) },
              });

              if (!utilisateur) {
                console.warn(
                  `Utilisateur avec idapimo ${user} non trouvé, relation ignorée.`
                );
                continue;
              }

              console.log("Utilisateur trouvé:", utilisateur);

              try {
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

                console.log("Relation créée/mise à jour:", relation);

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
                  console.log(
                    `Chiffre d'affaires mis à jour pour l'utilisateur ${utilisateur.id}`
                  );
                }
              } catch (error) {
                console.error(
                  "Erreur lors de la création/mise à jour de la relation:",
                  error
                );
              }
            }
          }

          // Gérer les contacts
          if (contrat.contacts && Array.isArray(contrat.contacts)) {
            console.log(
              `Traitement de ${contrat.contacts.length} contacts pour le contrat ${id}`
            );

            for (const contact of contrat.contacts) {
              const { contact: contactId, type } = contact;

              // Ne pas insérer les contacts avec le type 3 ou 4
              if (!contactId || !type || type === "3" || type === "4") {
                continue;
              }

              try {
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
                console.log(`Contact ${contactId} associé au contrat ${id}`);
              } catch (error) {
                console.error(
                  "Erreur lors de l'association du contact:",
                  error
                );
              }
            }
          }
        } catch (error) {
          console.error("Erreur lors du traitement du contrat:", error);
          console.error("Détails du contrat en erreur:", {
            id,
            step,
            property,
            price,
            price_net,
            commission,
            contract_at,
          });
        }
      }
    }

    console.log("Contrats et relations insérés avec succès");
  } catch (error) {
    console.error("Erreur lors de l'insertion des contrats :", error);
    throw error;
  }
}
