// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    // Create a test account on Ethereal
    const testAccount = await nodemailer.createTestAccount();

    // Create transporter using test SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Send the email
    const info = await transporter.sendMail({
      from: `"Support" <${testAccount.user}>`,
      to,
      subject,
      html,
    });

    // Log a preview URL to view the email in the browser
    console.log("✅ Email sent! Preview it here:", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("⚠️ Failed to send email:", err.message);
    throw err;
  }
};
