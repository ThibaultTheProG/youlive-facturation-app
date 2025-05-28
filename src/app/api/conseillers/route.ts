import { NextResponse } from "next/server";
import prisma from "@/lib/db";

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

export async function GET() {
  try {
    // Récupération des conseillers depuis l'API externe
    const response = await fetch("https://api.apimo.pro/agencies/24045/users", {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.USERNAME}:${process.env.PASSWORD}`
        ).toString("base64")}`,
        cache: "force-cache",
      },
    });
    
    const brut = await response.json();
    const conseillers: ConseillerInput[] = brut.users;
    
    // Insertion des conseillers dans la BDD
    if (!Array.isArray(conseillers)) {
      throw new Error("Les données conseillers ne sont pas valides.");
    }
    
    for (const conseiller of conseillers) {
      const { id, firstname, lastname, email, phone, mobile, city, partners } = conseiller;
      const adresse = city?.name || null;
      const siren = partners?.[0]?.reference;
      const idToNumber = Number(id);
      
      if (!firstname || !lastname) continue;
      
      // Créer ou mettre à jour le conseiller
      const utilisateur = await prisma.utilisateurs.upsert({
        where: {
          idapimo: idToNumber
        },
        update: {
          prenom: firstname,
          nom: lastname,
          email: email || null,
          telephone: phone || null,
          mobile: mobile || null,
          siren: siren || null,
        },
        create: {
          idapimo: idToNumber,
          prenom: firstname,
          nom: lastname,
          email: email || null,
          telephone: phone || null,
          mobile: mobile || null,
          adresse,
          siren: siren || null,
          role: "conseiller",
        },
      });

      // Créer automatiquement une entrée dans la table parrainages
      await prisma.parrainages.upsert({
        where: {
          user_id: utilisateur.id
        },
        create: {
          user_id: utilisateur.id,
          niveau1: null,
          niveau2: null,
          niveau3: null
        },
        update: {} // Ne rien mettre à jour si l'entrée existe déjà
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Conseillers synchronisés avec succès",
      count: conseillers.length
    });
  } catch (error) {
    console.error("Erreur lors de la synchronisation des conseillers :", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation des conseillers" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, parrain_id, niveau2_id, niveau3_id, ...conseillerData } = data;

    // Ajout de logs pour déboguer
    console.log("Données reçues:", {
      id,
      parrain_id,
      niveau2_id,
      niveau3_id,
      ...conseillerData
    });

    if (!id) {
      return NextResponse.json(
        { error: "ID du conseiller manquant" },
        { status: 400 }
      );
    }

    // Mise à jour des informations du conseiller
    try {
      await prisma.utilisateurs.update({
        where: { id: Number(id) },
        data: conseillerData
      });
      console.log("Mise à jour utilisateur réussie");
    } catch (updateError) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", updateError);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour de l'utilisateur: ${updateError instanceof Error ? updateError.message : String(updateError)}` },
        { status: 500 }
      );
    }

    // Gestion des parrainages
    try {
      const existingParrainage = await prisma.parrainages.findFirst({
        where: { user_id: Number(id) }
      });
      console.log("Parrainage existant:", existingParrainage);

      // Préparation des données de parrainage avec vérification des valeurs
      const parrainageData = {
        niveau1: parrain_id ? Number(parrain_id) : null,
        niveau2: niveau2_id ? Number(niveau2_id) : null,
        niveau3: niveau3_id ? Number(niveau3_id) : null
      };
      
      console.log("Données de parrainage à enregistrer:", parrainageData);

      // Mise à jour ou création du parrainage
      if (existingParrainage) {
        await prisma.parrainages.update({
          where: { id: existingParrainage.id },
          data: parrainageData
        });
        console.log("Mise à jour parrainage réussie");
      } else if (parrain_id || niveau2_id || niveau3_id) {
        await prisma.parrainages.create({
          data: {
            user_id: Number(id),
            ...parrainageData
          }
        });
        console.log("Création parrainage réussie");
      }
    } catch (parrainageError) {
      console.error("Erreur lors de la gestion des parrainages:", parrainageError);
      return NextResponse.json(
        { error: `Erreur lors de la gestion des parrainages: ${parrainageError instanceof Error ? parrainageError.message : String(parrainageError)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Conseiller mis à jour avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du conseiller:", error);
    return NextResponse.json(
      { error: `Erreur lors de la mise à jour du conseiller: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
