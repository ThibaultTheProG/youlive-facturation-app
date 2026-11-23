import nodemailer, { type SendMailOptions } from 'nodemailer';
import { baseUrl, destinataires, sujet } from './environnement';
import { adressesPour } from './emailsConfiguration';
import { formatEuro } from './emailFacture';

/**
 * Seul transporteur SMTP de l'application : tout envoi passe par `envoyerEmail`.
 * Il était auparavant recréé dans `/api/factures/create` (à chaque email du
 * cron) et dans `/api/factures/send`, avec des réglages divergents — dont
 * `tls.rejectUnauthorized: false` ici seulement, qui désactivait la vérification
 * du certificat du serveur SMTP, identifiants compris. Les deux autres envois
 * fonctionnaient sans : l'option est abandonnée.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER_HOST,
  port: parseInt(process.env.SMTP_SERVER_PORT || '465', 10),
  secure: true, // port 465
  auth: {
    user: process.env.SMTP_SERVER_USERNAME,
    pass: process.env.SMTP_SERVER_PASSWORD,
  },
});

/**
 * Envoie un email. Les destinataires (`to`, `cc`) et le sujet doivent déjà
 * être passés par `destinataires()` et `sujet()` (déroutage hors production).
 */
export async function envoyerEmail(options: SendMailOptions) {
  return transporter.sendMail(options);
}

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
  const copies = await adressesPour('invitation', 'cc');

  try {
    await envoyerEmail({
      from: `"Youlive" <${process.env.SMTP_SERVER_USERNAME}>`,
      // Hors production, l'invitation ne doit surtout pas partir au conseiller :
      // il définirait son mot de passe dans la base de préproduction et se
      // croirait activé côté production.
      to: destinataires([email]),
      cc: copies.length ? destinataires(copies) : undefined,
      subject: sujet('Active ton espace de facturation Youlive', [email, ...copies]),
      html: `
        <h1>Bienvenue ${prenom} ${nom} !</h1>
        <p>Ton espace de factures en ligne est prêt : tu pourras y suivre le paiement de tes commissions, l'évolution de ton chiffre d'affaires et celui des conseillers que tu auras recrutés.</p>
        <p>Pour l'activer, choisis ton mot de passe en cliquant sur le lien ci-dessous :</p>
        <p><a href="${lien}" style="display:inline-block;padding:12px 20px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Définir mon mot de passe</a></p>
        <p>Ce lien est personnel et valable <strong>48 heures</strong>. Il ne fonctionnera qu'une seule fois.</p>
        <p>Tu te connecteras ensuite avec ton adresse email : <strong>${email}</strong></p>
        <p>Ces identifiants (adresse email et mot de passe) te servent aussi à te connecter à l'application <strong>Avis de valeur</strong> : tu n'as pas de second compte à créer.</p>
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
 * Les adresses configurées dans `/admin/emails` sont en copie.
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
  const copies = await adressesPour('club99', 'cc');
  const lien = `${baseUrl()}/conseiller/factures`;
  const salutation = prenom ? `Hello ${echapperHtml(prenom)},` : 'Hello,';

  try {
    await envoyerEmail({
      from: `"Youlive" <${process.env.SMTP_SERVER_USERNAME}>`,
      to: destinataires([email]),
      cc: copies.length ? destinataires(copies) : undefined,
      subject: sujet('Bienvenue dans le club des 99 % ! 🎉', [email, ...copies]),
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

/** Libellés des types de notification empilés par le cron `/api/factures/create`. */
const LIBELLES_NOTIFICATION: Record<string, string> = {
  commission_avant_seuil: 'commission',
  commission_apres_seuil: 'commission (au-delà du seuil de 70 000 €)',
  recrutement: 'recrutement',
};

/**
 * Notification au conseiller d'une facture créée par le cron nocturne, une par
 * facture. Les adresses configurées dans `/admin/emails` sont en copie.
 * Ne lève jamais : un échec d'envoi ne doit pas bloquer la création des factures.
 */
export async function sendNotificationFacture({
  email,
  factureType,
  montant,
}: {
  email: string | null | undefined;
  factureType: string;
  montant: number;
}) {
  if (!email) {
    console.error(`Notification de facture (${factureType}) non envoyée : conseiller sans email.`);
    return false;
  }

  const libelle = LIBELLES_NOTIFICATION[factureType] ?? factureType;
  const montantFormate = formatEuro(montant);
  const lien = `${baseUrl()}/conseiller/factures`;

  try {
    const copies = await adressesPour('notification_facture', 'cc');
    await envoyerEmail({
      from: process.env.SMTP_FROM_EMAIL,
      to: destinataires([email]),
      cc: copies.length ? destinataires(copies) : undefined,
      subject: sujet(`Nouvelle facture de ${libelle} créée`, [email, ...copies]),
      text: `Une nouvelle facture de ${libelle} d'un montant de ${montantFormate} HT a été créée pour vous. Consultez-la dans votre espace : ${lien}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #e67e22;">Nouvelle facture créée</h2>
          <p>Bonjour,</p>
          <p>Une nouvelle facture a été créée dans votre espace :</p>
          <ul>
            <li><strong>Type :</strong> ${libelle}</li>
            <li><strong>Montant :</strong> ${montantFormate} HT</li>
          </ul>
          <p><a href="${lien}" style="display:inline-block;padding:12px 20px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Voir mes factures</a></p>
          <p>Cordialement,<br>L'équipe YouLive</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de facture :', error);
    return false;
  }
}
