import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { sendQuestionNotification, sendAnswerNotification } from "./src/utils/email.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const destEmail = "npvkhai23@clc.fitus.edu.vn";

const testRealEmail = async () => {
  console.log("Testing REAL email sending via Gmail...\n");

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("ERROR: Email credentials not configured!");
    console.log("\nPlease follow the guide in SETUP_GMAIL_GUIDE.md");
    console.log("1. Create Gmail App Password");
    console.log("2. Update .env file with credentials\n");
    return;
  }

  console.log("Email Configuration:");
  console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`SMTP User: ${process.env.SMTP_USER}`);
  console.log(`Sending to: ${destEmail}\n`);

  try {
    // Test 1: Question Notification Email
    console.log("1️. Sending Question Notification Email...");
    
    await sendQuestionNotification({
      sellerEmail: destEmail,
      sellerName: "Khải Nguyễn",
      productTitle: "iPhone 15 Pro Max 256GB - Titan Tự Nhiên",
      buyerName: "Nguyễn Văn A",
      questionText: "Sản phẩm còn hàng không ạ? Bao giờ ship được? Có bảo hành chính hãng không?",
      productUrl: "http://localhost:5173/products/123456"
    });

    console.log("Question email sent!");
    console.log("Check inbox: khaivole11@gmail.com\n");

    // Đợi 2 giây để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Answer Notification Email
    console.log("2️. Sending Answer Notification Email...");
    
    await sendAnswerNotification({
      buyerEmail: destEmail,
      buyerName: "Khải Nguyễn",
      productTitle: "iPhone 15 Pro Max 256GB - Titan Tự Nhiên",
      questionText: "Sản phẩm còn hàng không ạ? Bao giờ ship được?",
      answerText: "Dạ vẫn còn hàng ạ! Nếu anh đặt hôm nay thì mai shop sẽ giao luôn. Sản phẩm có bảo hành chính hãng Apple 12 tháng nhé!",
      productUrl: "http://localhost:5173/products/123456"
    });

    console.log("Answer email sent!");
    console.log("Check inbox: khaivole11@gmail.com\n");

    // Summary
    console.log("================================================");
    console.log("All emails sent successfully!\n");
    console.log("Check your Gmail inbox:");
    console.log("   → https://mail.google.com");
    console.log(`   → Login: ${destEmail}\n`);
    console.log("Tips:");
    console.log("   • Check Spam folder if you don't see emails");
    console.log("   • Emails should arrive within 1-2 minutes");
    console.log("   • Look for emails from: " + process.env.SMTP_USER);
    console.log("================================================\n");

  } catch (error) {
    console.error("\nERROR sending email:", error.message);
    
    if (error.message.includes("Invalid login")) {
      console.log("\nPossible solutions:");
      console.log("   1. Check SMTP_USER and SMTP_PASS in .env");
      console.log("   2. Make sure 2-Step Verification is enabled");
      console.log("   3. Create a new App Password");
      console.log("   4. Remove spaces from App Password\n");
    }
    
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
  }
};

testRealEmail();
