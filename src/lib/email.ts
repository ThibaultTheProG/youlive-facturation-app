import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER_HOST,
  port: parseInt(process.env.SMTP_SERVER_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_SERVER_USERNAME,
    pass: process.env.SMTP_SERVER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Email d'invitation : ne contient aucun mot de passe, uniquement un lien signé
 * valable 48h vers `/definir-mot-de-passe`. Remplace l'ancien
 * `sendPasswordEmail`, qui envoyait le mot de passe en clair.
 */
export async function sendInvitationEmail(
  email: string,
  lien: string,
  prenom: string,
  nom: string
) {
  try {
    await transporter.sendMail({
      from: `"Youlive" <${process.env.SMTP_SERVER_USERNAME}>`,
      to: email,
      subject: 'Active ton espace de facturation Youlive',
      html: `
        <h1>Bienvenue ${prenom} ${nom} !</h1>
        <p>Ton espace de factures en ligne est prêt : tu pourras y suivre le paiement de tes commissions, l'évolution de ton chiffre d'affaires et celui des conseillers que tu auras recrutés.</p>
        <p>Pour l'activer, choisis ton mot de passe en cliquant sur le lien ci-dessous :</p>
        <p><a href="${lien}" style="display:inline-block;padding:12px 20px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Définir mon mot de passe</a></p>
        <p>Ce lien est personnel et valable <strong>48 heures</strong>. Il ne fonctionnera qu'une seule fois.</p>
        <p>Tu te connecteras ensuite avec ton adresse email : <strong>${email}</strong></p>
        <p style="color:#666;font-size:13px;">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br>${lien}</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email d\'invitation :', error);
    return false;
  }
}
