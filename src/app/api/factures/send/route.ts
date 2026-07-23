import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from "@/lib/db";
import { computeMontantsFacture } from "@/utils/montantsFacture";
import { buildFactureAdminEmail } from "@/lib/emailFacture";

export async function POST(req: Request) {
  try {
    const { factureId } = await req.json();

    if (!factureId) {
      return NextResponse.json({ error: "L'ID de la facture est requis" }, { status: 400 });
    }

    // Charger la facture et son conseiller pour composer le mail
    const facture = await prisma.factures.findUnique({
      where: { id: factureId },
      include: { utilisateurs: true, relations_contrats: true },
    });

    if (!facture) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    }

    // Générer l'URL de la facture
    const factureUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/factures/${factureId}/pdf`;

    const conseiller = facture.utilisateurs;

    const montants = computeMontantsFacture(
      {
        retrocession: facture.retrocession,
        honoraires_agent: facture.relations_contrats?.honoraires_agent?.toString(),
        montant_honoraires: facture.montant_honoraires?.toString(),
        taux_retrocession: facture.taux_retrocession?.toString(),
        apporteur: facture.apporteur,
        apporteur_amount: facture.apporteur_amount,
        apply_tva: facture.apply_tva,
        taux_tva: facture.taux_tva?.toString(),
        montant_tva: facture.montant_tva?.toString(),
      },
      {
        tva: conseiller?.tva,
        taux_tva: conseiller?.taux_tva?.toString(),
      }
    );

    const { subject, html, text } = buildFactureAdminEmail({
      numero: facture.numero,
      type: facture.type,
      tranche: facture.tranche,
      date: facture.created_at,
      statutPaiement: facture.statut_paiement,
      conseiller: {
        prenom: conseiller?.prenom ?? null,
        nom: conseiller?.nom ?? null,
        email: conseiller?.email ?? null,
        nomSocieteFacture: conseiller?.nom_societe_facture ?? null,
        sirenFacture: conseiller?.siren_facture ?? null,
      },
      montants,
      factureUrl,
    });

    // Configuration du transporteur Nodemailer pour Infomaniak
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER_HOST,
      port: Number(process.env.SMTP_SERVER_PORT),
      secure: true, // true pour le port 465, false pour 587
      auth: {
        user: process.env.SMTP_SERVER_USERNAME,
        pass: process.env.SMTP_SERVER_PASSWORD,
      },
    });

    // Configuration de l'email
    const mailOptions = {
      from: `"Application facturation" <${process.env.SMTP_FROM_EMAIL}>`,
      to: [process.env.SMTP_TO_EMAIL, "laura.zanetta@youlive-immobilier.fr", "thibault.tuffin@websmith.fr"]
        .filter(Boolean)
        .join(", "),
      subject,
      text,
      html,
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    // Marquer la facture comme envoyée uniquement si l'email est bien parti
    await prisma.factures.update({
      where: { id: factureId },
      data: { statut_envoi: 'envoyée' }
    });

    return NextResponse.json({ message: "Email envoyé avec succès" }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}