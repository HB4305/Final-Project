import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script test gửi email theo template Q&A
 * Chạy: node backend/setup-test-email.js
 */

const loadTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, "src/templates/emails", `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, "utf-8");
    const template = handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error.message);
    throw error;
  }
};

const testEmailSetup = async () => {
  console.log("Setting up test email account...\n");

  try {
    // Tạo tài khoản Ethereal Email
    const testAccount = await nodemailer.createTestAccount();

    console.log("Test email account created!\n");
    console.log("================================================");
    console.log("Copy these to your .env file:\n");
    console.log(`SMTP_HOST=${testAccount.smtp.host}`);
    console.log(`SMTP_PORT=${testAccount.smtp.port}`);
    console.log(`SMTP_USER=${testAccount.user}`);
    console.log(`SMTP_PASS=${testAccount.pass}`);
    console.log(`SMTP_FROM=${testAccount.user}`);
    console.log(`APP_NAME=Auction Platform`);
    console.log(`FRONTEND_BASE_URL=http://localhost:5173`);
    console.log("================================================\n");

    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log("Testing Q&A Email Templates...\n");

    // Test 1: Question Notification
    console.log("1️. Testing Question Notification Template...");
    const questionHtml = await loadTemplate("question-notification", {
      sellerName: "John Doe (Seller)",
      productTitle: "iPhone 15 Pro Max 256GB",
      buyerName: "Jane Smith (Buyer)",
      questionText: "Sản phẩm còn hàng không ạ? Bao giờ ship được?",
      productUrl: "http://localhost:5173/products/123456",
      timestamp: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    const questionInfo = await transporter.sendMail({
      from: `"Auction Platform" <${testAccount.user}>`,
      to: "seller@example.com",
      subject: "New Question about Your Product: iPhone 15 Pro Max",
      html: questionHtml,
    });

    console.log("Question email sent!");
    console.log(`View at: ${nodemailer.getTestMessageUrl(questionInfo)}\n`);

    // Test 2: Answer Notification
    console.log("2. Testing Answer Notification Template...");
    const answerHtml = await loadTemplate("answer-notification", {
      buyerName: "Jane Smith (Buyer)",
      productTitle: "iPhone 15 Pro Max 256GB",
      questionText: "Sản phẩm còn hàng không ạ? Bao giờ ship được?",
      answerText: "Dạ sản phẩm vẫn còn hàng. Nếu đặt hôm nay thì mai shop sẽ ship luôn ạ.",
      productUrl: "http://localhost:5173/products/123456",
      timestamp: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    const answerInfo = await transporter.sendMail({
      from: `"Auction Platform" <${testAccount.user}>`,
      to: "buyer@example.com",
      subject: "Your Question Has Been Answered",
      html: answerHtml,
    });

    console.log("Answer email sent!");
    console.log(`View at: ${nodemailer.getTestMessageUrl(answerInfo)}\n`);

    // Summary
    console.log("================================================");
    console.log("All tests completed successfully!\n");
    console.log("View all emails at: https://ethereal.email/messages");
    console.log(`Login: ${testAccount.user}`);
    console.log(`Password: ${testAccount.pass}\n`);
    console.log("================================================");
    console.log("Email Links:");
    console.log(`Question: ${nodemailer.getTestMessageUrl(questionInfo)}`);
    console.log(`Answer: ${nodemailer.getTestMessageUrl(answerInfo)}`);
    console.log("================================================\n");

  } catch (error) {
    console.error("Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
};

testEmailSetup();
