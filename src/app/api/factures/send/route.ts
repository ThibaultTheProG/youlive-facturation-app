import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { factureId } = await req.json();

    if (!factureId) {
      return NextResponse.json({ error: "L'ID de la facture est requis" }, { status: 400 });
    }

    // Mettre à jour le statut d'envoi de la facture
    await prisma.factures.update({
      where: { id: factureId },
      data: { statut_envoi: 'envoyée' }
    });

    // Générer l'URL de la facture
    const factureUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/factures/${factureId}/pdf`;

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
      to: process.env.SMTP_TO_EMAIL,
      subject: "Une nouvelle facture est disponible",
      html: `<p>Bonjour,</p>
             <p>Une nouvelle facture est disponible.</p>
             <p><a href="${factureUrl}" target="_blank">Cliquez ici pour voir la facture</a></p>
             <p>Ou copiez ce lien dans votre navigateur :</p>
             <p>${factureUrl}</p>
             <p>Cordialement,</p>
             <p>Thibault</p>`,
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Email envoyé avec succès" }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}