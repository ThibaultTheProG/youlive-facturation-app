import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPasswordEmail(email: string, password: string, prenom: string, nom: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Vos identifiants de connexion',
      html: `
        <h1>Bienvenue ${prenom} ${nom} !</h1>
        <p>Nous vous avons attribué un mot de passe pour accéder à votre compte.</p>
        <p>Voici vos identifiants de connexion :</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Mot de passe :</strong> ${password}</p>
        <p>Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email :', error);
    return false;
  }
} 