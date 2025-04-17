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
      from: process.env.SMTP_FROM,
      to: "tuffinthibaultgw@gmail.com",
      subject: 'Vos identifiants de connexion',
      html: `
        <h1>Bienvenue ${prenom} ${nom} !</h1>
        <p>Nous vous avons attribué un mot de passe pour accéder à votre compte.</p>
        <p>Voici vos identifiants de connexion :</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Mot de passe :</strong> ${password}</p>
        <p>Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
        <p>Merci de vous connecter ici : <a href="${process.env.NEXT_PUBLIC_BASE_URL}">${process.env.NEXT_PUBLIC_BASE_URL}</a></p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email :', error);
    return false;
  }
} 