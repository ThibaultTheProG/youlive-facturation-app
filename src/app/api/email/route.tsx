import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configuration du transporteur d'emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "votre-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "votre-mot-de-passe-app",
  },
});

export async function POST(request: Request) {
  try {
    // Récupérer les données de la requête
    const { to, subject, text, html } = await request.json();

    // Vérifier que les champs requis sont présents
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Configuration de l'email
    const mailOptions = {
      from: process.env.EMAIL_FROM || "YouLive <no-reply@youlive.fr>",
      to,
      subject,
      text,
      html,
    };

    console.log("📧 Tentative d'envoi d'email à:", to);

    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email envoyé avec succès:", info.messageId);

    return NextResponse.json({
      message: "Email envoyé avec succès",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
