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
      
      await prisma.utilisateurs.upsert({
        where: {
          idapimo: idToNumber
        },
        update: {
          prenom: firstname,
          nom: lastname,
          email: email || null,
          telephone: mobile || phone || null,
          siren: siren || null,
        },
        create: {
          idapimo: idToNumber,
          prenom: firstname,
          nom: lastname,
          email: email || null,
          telephone: mobile || phone || null,
          adresse,
          siren: siren || null,
          role: "conseiller",
        },
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
