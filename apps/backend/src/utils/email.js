const nodemailer = require('nodemailer');

// Envio de e-mail. Se o SMTP não estiver configurado no .env, o conteúdo
// é apenas logado no console (útil no desenvolvimento local).
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

const REMETENTE = process.env.SMTP_FROM || 'Roteiro Nutri <nao-responda@roteironutri.com>';

/**
 * Envia um e-mail. Nunca lança erro: uma falha no envio não deve impedir
 * a operação principal (ex: cadastro do paciente).
 * @returns {Promise<boolean>} true se foi enviado por SMTP
 */
async function enviarEmail({ para, assunto, texto }) {
  if (!transporter) {
    console.log(`[e-mail não enviado: SMTP não configurado]\nPara: ${para}\nAssunto: ${assunto}\n${texto}\n`);
    return false;
  }
  try {
    await transporter.sendMail({ from: REMETENTE, to: para, subject: assunto, text: texto });
    return true;
  } catch (err) {
    console.error('Falha ao enviar e-mail:', err.message);
    return false;
  }
}

module.exports = { enviarEmail, emailConfigurado: () => !!transporter };
