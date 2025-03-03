"use server";

import prisma from "../lib/db";
import { Conseiller } from "@/lib/types";

type ConseillerInput = {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: { name: string };
  partners?: Array<{ reference: string }>;
};

export async function insertConseillers(conseillers: ConseillerInput[]) {
  if (!Array.isArray(conseillers)) {
    throw new Error("Les données conseillers ne sont pas valides.");
  }

  try {
    for (const conseiller of conseillers) {
      const { id, firstname, lastname, email, phone, mobile, city, partners } = conseiller;
      const adresse = city?.name || null;
      const siren = partners?.[0]?.reference;
      const idToNumber = Number(id);

      if (!firstname || !lastname) continue;

      await prisma.utilisateurs.upsert({
        where: {
          idapimo: idToNumber
        },
        update: {
          prenom: firstname,
          nom: lastname,
          email: email || null,
          telephone: phone || null,
          mobile: mobile || null,
          adresse: adresse,
          siren: siren || null,
          updated_at: new Date()
        },
        create: {
          idapimo: idToNumber,
          prenom: firstname,
          nom: lastname,
          email: email || null,
          telephone: phone || null,
          mobile: mobile || null,
          adresse: adresse,
          role: "conseiller",
          siren: siren || null,
          created_at: new Date()
        }
      });
    }

    console.log("Conseillers insérés avec succès");
  } catch (error) {
    console.error("Erreur lors de l'insertion des conseillers", error);
    throw error;
  }
}

export async function getConseillersBDD(): Promise<Conseiller[]> {
  try {
    console.log("Début de getConseillersBDD");
    const conseillers = await prisma.utilisateurs.findMany();
    console.log("Données brutes de la BDD:", conseillers);

    if (!conseillers || conseillers.length === 0) {
      console.log("Aucun conseiller trouvé dans la BDD");
      return [];
    }

    const mappedConseillers = conseillers.map(c => ({
      ...c,
      siren: c.siren ? parseInt(c.siren) : undefined,
      chiffre_affaires: c.chiffre_affaires ? Number(c.chiffre_affaires) : 0,
      retrocession: c.retrocession ? Number(c.retrocession) : 0
    })) as unknown as Conseiller[];

    console.log("Conseillers après mapping:", mappedConseillers);
    return mappedConseillers;
  } catch (error) {
    console.error("Erreur détaillée lors de la récupération des conseillers:", error);
    console.error("Stack trace:", (error as Error).stack);
    return [];
  }
}

export async function updateConseillerBDD(
  formData: FormData,
  id: number,
  parrain_id?: number | null
) {
  const rawFormData = {
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    email: formData.get("email"),
    telephone: formData.get("telephone"),
    localisation: formData.get("localisation"),
    tva: formData.get("assujetti_tva"),
    type_contrat: formData.get("type_contrat"),
    retrocession: formData.get("retrocession"),
    autoParrain: formData.get("auto_parrain")
  };

  try {
    // Mise à jour des informations du conseiller
    await prisma.utilisateurs.update({
      where: { id },
      data: {
        adresse: rawFormData.localisation?.toString() || null,
        tva: rawFormData.tva === "oui",
        typecontrat: rawFormData.type_contrat?.toString() || null,
        retrocession: rawFormData.retrocession ? parseFloat(rawFormData.retrocession.toString()) : null,
        auto_parrain: rawFormData.autoParrain?.toString() || "non",
        updated_at: new Date()
      }
    });

    // Si un parrain est spécifié, mettre à jour ou créer le parrainage
    if (parrain_id) {
      const existingParrainage = await prisma.parrainages.findFirst({
        where: { user_id: id }
      });

      if (existingParrainage) {
        await prisma.parrainages.update({
          where: { id: existingParrainage.id },
          data: { niveau1: parrain_id }
        });
      } else {
        await prisma.parrainages.create({
          data: {
            user_id: id,
            niveau1: parrain_id
          }
        });
      }
    }

    console.log("Conseiller mis à jour avec succès.");
  } catch (error) {
    console.error("Impossible de modifier les informations associées au conseiller", error);
    throw error;
  }
}

export async function getParrainLevel(idConseiller: number, niveau: number): Promise<{id: number | null, nom: string}> {
  try {
    const parrainage = await prisma.parrainages.findFirst({
      where: {
        user_id: idConseiller
      }
    });

    if (!parrainage) return { id: null, nom: "Aucun" };

    let parrainId: number | null = null;
    
    switch(niveau) {
      case 1:
        parrainId = parrainage.niveau1;
        break;
      case 2:
        parrainId = parrainage.niveau2;
        break;
      case 3:
        parrainId = parrainage.niveau3;
        break;
    }

    if (!parrainId) return { id: null, nom: "Aucun" };

    const parrain = await prisma.utilisateurs.findUnique({
      where: { id: parrainId }
    });

    return {
      id: parrainId,
      nom: parrain ? `${parrain.prenom} ${parrain.nom}` : "Aucun"
    };
  } catch (error) {
    console.error(`Impossible de récupérer le parrain de niveau ${niveau} :`, error);
    return { id: null, nom: "Aucun" };
  }
}

interface ParrainageData {
  user_id: number;
  niveau1: number | null;
  niveau2: number | null;
  niveau3: number | null;
}

export async function handleParrainages(data: ParrainageData) {
  try {
    const existingParrainage = await prisma.parrainages.findFirst({
      where: { user_id: data.user_id }
    });

    if (existingParrainage) {
      return await prisma.parrainages.update({
        where: { id: existingParrainage.id },
        data: {
          niveau1: data.niveau1,
          niveau2: data.niveau2,
          niveau3: data.niveau3
        }
      });
    } else {
      return await prisma.parrainages.create({
        data: {
          user_id: data.user_id,
          niveau1: data.niveau1,
          niveau2: data.niveau2,
          niveau3: data.niveau3
        }
      });
    }
  } catch (error) {
    console.error("Erreur lors de la gestion des parrainages :", error);
    throw error;
  }
}
