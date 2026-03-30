const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

async function sendOtpEmail({ to, name, otp }) {
  const from = process.env.FROM_EMAIL || "no-reply@jatayu.local";
  const appName = process.env.APP_NAME || "Jatayu";
  const transporterInstance = getTransporter();

  const mailOptions = {
    from,
    to,
    subject: `${appName} signup OTP verification`,
    text: `Hello ${name},\n\nYour OTP for signup is: ${otp}\nThis OTP expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.\n\nIf you did not request this, please ignore this email.`,
  };

  const info = await transporterInstance.sendMail(mailOptions);
  return info;
}

module.exports = { sendOtpEmail };
