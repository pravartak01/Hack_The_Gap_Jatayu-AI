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

async function sendHazardAlertEmail({ recipients, hazardType, location, description }) {
  const from = process.env.FROM_EMAIL || "no-reply@jatayu.local";
  const appName = process.env.APP_NAME || "Jatayu";
  const transporterInstance = getTransporter();

  if (!recipients || recipients.length === 0) {
    const error = new Error("No email recipients provided");
    error.statusCode = 400;
    throw error;
  }

  const timestamp = new Date().toLocaleString();
  const hazardTypeDisplay = String(hazardType || "Unknown").toUpperCase();

  const mailOptions = {
    from,
    to: recipients.join(", "),
    subject: `[${appName} ALERT] Hazard Detected: ${hazardTypeDisplay}`,
    text: `
HAZARD ALERT - ${appName}
=========================================

Hazard Type: ${hazardTypeDisplay}
Location: ${location || "Not specified"}
Timestamp: ${timestamp}
Description: ${description || "No additional details provided"}

Please take immediate action if needed.

---
This is an automated alert from ${appName} System
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #fff; padding: 20px; border-radius: 5px; border-left: 5px solid #d32f2f;">
    <h2 style="color: #d32f2f; margin: 0 0 15px 0;">HAZARD ALERT - ${appName}</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 150px;">Hazard Type:</td>
        <td style="padding: 8px;">${hazardTypeDisplay}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 8px; font-weight: bold;">Location:</td>
        <td style="padding: 8px;">${location || "Not specified"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold;">Timestamp:</td>
        <td style="padding: 8px;">${timestamp}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 8px; font-weight: bold;">Description:</td>
        <td style="padding: 8px;">${description || "No additional details provided"}</td>
      </tr>
    </table>
    <p style="margin-top: 15px; color: #666; font-size: 12px;">
      <strong>Please take immediate action if needed.</strong>
    </p>
    <p style="margin-top: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px;">
      This is an automated alert from ${appName} System
    </p>
  </div>
</div>
    `.trim(),
  };

  const info = await transporterInstance.sendMail(mailOptions);
  return info;
}

module.exports = { sendOtpEmail, sendHazardAlertEmail };
