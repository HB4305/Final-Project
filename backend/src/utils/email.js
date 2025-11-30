import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo transporter function để load credentials khi cần
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Load and compile email template
 */
const loadTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, "utf-8");
    const template = handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

export const sendEmail = async (options) => {
  try {
    const transporter = getTransporter();
    const mailOptions = {
        from:`"${process.env.APP_NAME || 'Auction Platform'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]+>/g, ''), 
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: %s`, info.messageId);
    return info;

  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

/**
 * Send question notification to seller
 */
export const sendQuestionNotification = async (data) => {
  try {
    const html = await loadTemplate("question-notification", {
      sellerName: data.sellerName,
      productTitle: data.productTitle,
      buyerName: data.buyerName,
      questionText: data.questionText,
      productUrl: data.productUrl,
      timestamp: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    return sendEmail({
      to: data.sellerEmail,
      subject: `New Question about Your Product: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending question notification:", error);
  }
};

/**
 * Send answer notification to buyer
 */
export const sendAnswerNotification = async (data) => {
  try {
    const html = await loadTemplate("answer-notification", {
      buyerName: data.buyerName,
      productTitle: data.productTitle,
      questionText: data.questionText,
      answerText: data.answerText,
      productUrl: data.productUrl,
      timestamp: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    return sendEmail({
      to: data.buyerEmail,
      subject: `Your Question Has Been Answered: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending answer notification:", error);
  }
};

export const verifyEmailConfiguration = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email credentials not configured. Email features will be disabled.");
    return false;
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("Email server is ready to send messages");
    console.log(`Using: ${process.env.SMTP_USER}`);
    return true;
  } catch (error) {
    console.error("Email server configuration error:", error.message);
    return false;
  }
};
