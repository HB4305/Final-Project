import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Utility to send an email using nodemailer
 *
 * NOTE: For this to work, you must configure the following environment variables in your .env file:
 *
 * EMAIL_HOST="smtp.gmail.com"
 * EMAIL_PORT=587
 * EMAIL_USER="your-email@gmail.com"
 * EMAIL_PASS="your-app-password"
 * FROM_NAME="Your App Name"
 * FROM_EMAIL="your-email@gmail.com"
 *
 */
export const sendEmail = async (options) => {
  // Configure transporter for Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME || "AuctionHub"}" <${
      process.env.FROM_EMAIL || process.env.EMAIL_USER
    }>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // Re-throw the error to be handled by the calling service
    throw new Error("Email could not be sent.");
  }
};
