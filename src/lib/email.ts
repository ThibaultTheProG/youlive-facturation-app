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

export async function sendPasswordEmail(email: string, password: string, prenom: string, nom: string) {
  try {
    await transporter.sendMail({
      from: `"Youlive" <${process.env.SMTP_SERVER_USERNAME}>`,
      to: email,
      subject: 'Tes identifiants de connexion sont disponibles',
      html: `
        <h1>Bienvenue ${prenom} ${nom} !</h1>
        <p>Nous t'avons attribué un mot de passe pour accéder à ton espace de factures en ligne pour le paiement et le suivi de tes commissions.</p>
        <p>Tu pourras également suivre l'évolution de ton chiffre d'affaires et celui des conseillers que tu auras recrutés.</p>
        <p>Voici tes identifiants de connexion :</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Mot de passe :</strong> ${password}</p>
        <p>Pour des raisons de sécurité, nous te recommandons de changer ton mot de passe lors de ta première connexion.</p>
        <p>Merci de te connecter ici : <a href="${process.env.NEXT_PUBLIC_BASE_URL}">${process.env.NEXT_PUBLIC_BASE_URL}</a></p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email :', error);
    return false;
  }
} 