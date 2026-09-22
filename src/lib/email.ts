import nodemailer from 'nodemailer';
import { baseUrl, destinataires, emailsAdminFactures, sujet } from './environnement';

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
      // Hors production, l'invitation ne doit surtout pas partir au conseiller :
      // il définirait son mot de passe dans la base de préproduction et se
      // croirait activé côté production.
      to: destinataires([email]),
      subject: sujet('Active ton espace de facturation Youlive', [email]),
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

function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Félicitations au franchissement du seuil de CA annuel (70 000 €) : la
 * rétrocession passe à 99 %. Déclenché par la sync `/api/contrats`, une seule
 * fois par (conseiller, année) — cf. `historique_ca_annuel.email_club99_envoye_le`.
 * L'administration est en copie.
 */
export async function sendEmailClub99({
  email,
  prenom,
  annee,
}: {
  email: string;
  prenom: string | null;
  annee: number;
}) {
  const admins = emailsAdminFactures();
  const lien = `${baseUrl()}/conseiller/factures`;
  const salutation = prenom ? `Hello ${echapperHtml(prenom)},` : 'Hello,';

  try {
    await transporter.sendMail({
      from: `"Youlive" <${process.env.SMTP_SERVER_USERNAME}>`,
      to: destinataires([email]),
      cc: admins.length ? destinataires(admins) : undefined,
      subject: sujet('Bienvenue dans le club des 99 % ! 🎉', [email, ...admins]),
      html: `
        <p>${salutation}</p>
        <p>J’ai le plaisir de t’annoncer que tu viens de franchir le seuil des <strong>70 000 € HT</strong> de chiffre d’affaires agence pour l’année ${annee} ! 🎉</p>
        <p>Grâce à cette belle performance, tu intègres désormais le <strong>club des 99 %</strong> : toutes tes futures ventes signées d’ici au 31 décembre ${annee} te permettront de percevoir 99 % des honoraires d’agence, conformément aux conditions de ton offre. La vente qui te fait franchir le cap en profite déjà : la part au-delà des 70 000 € est rétrocédée à 99 %.</p>
        <p>C’est une très belle réussite qui récompense ton implication, ton professionnalisme et le travail accompli depuis ton arrivée au sein du réseau.</p>
        <p>Toute l’équipe Youlive te félicite pour cette réussite et te souhaite encore de nombreuses ventes pour la suite.</p>
        <p>Encore bravo pour ce cap franchi !</p>
        <p><a href="${lien}" style="display:inline-block;padding:12px 20px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Voir mes factures</a></p>
        <p>L’équipe Youlive</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email club des 99 % :', error);
    return false;
  }
}
