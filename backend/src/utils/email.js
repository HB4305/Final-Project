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
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Load and compile email template
 */
const loadTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/emails",
      `${templateName}.html`
    );
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
      from: `"${process.env.FROM_NAME || "Auction Platform"}" <${
        process.env.FROM_EMAIL || process.env.EMAIL_USER
      }>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ""),
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
      subject: `Câu hỏi mới về sản phẩm của bạn: ${data.productTitle}`,
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
      subject: `Câu hỏi của bạn đã được trả lời: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending answer notification:", error);
  }
};

/**
 * Send description updated notification to bidder
 */
export const sendProductDescriptionUpdatedNotification = async (data) => {
  try {
    const html = await loadTemplate("description-updated", {
      bidderName: data.bidderName,
      sellerName: data.sellerName,
      productTitle: data.productTitle,
      productUrl: data.productUrl,
      timestamp: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    return sendEmail({
      to: data.bidderEmail,
      subject: `Thông báo cập nhật mô tả: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending description updated notification:", error);
  }
};

/**
 * Send email bid success notification
 */
export const sendBidSuccessNotification = async (data) => {
  try {
    const html = await loadTemplate("bid-success", {
      bidderEmail: data.bidderEmail,
      bidderName: data.bidderName,
      productTitle: data.productTitle,
      bidAmount: Number(data.bidAmount).toLocaleString("vi-VN"),
      currentPrice: Number(data.currentPrice).toLocaleString("vi-VN"),
      isHighestBidder: data.isHighestBidder,
      productUrl: data.productUrl,
    });

    return sendEmail({
      to: data.bidderEmail,
      subject: `Thông báo đặt giá thành công: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending bid success notification:", error);
  }
};

/**
 * Send price updated notification
 */
export const sendPriceUpdatedNotification = async (data) => {
  try {
    const html = await loadTemplate("price-updated-seller", {
      sellerName: data.sellerName,
      productTitle: data.productTitle,
      previousPrice: Number(data.previousPrice).toLocaleString("vi-VN"),
      newPrice: Number(data.newPrice).toLocaleString("vi-VN"),
      bidderName: data.bidderName,
      totalBids: data.totalBids,
      auctionUrl: data.auctionUrl,
      auctionEndTime: new Date(data.auctionEndTime).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    return sendEmail({
      to: data.sellerEmail,
      subject: `Cập nhật giá: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending price updated notification:", error);
  }
};

/**
 * Send outbid notification
 */
export const sendOutbidNotification = async (data) => {
  try {
    const html = await loadTemplate("outbid-notification", {
      previousBidderName: data.previousBidderName,
      productTitle: data.productTitle,
      yourBidAmount: Number(data.yourBidAmount).toLocaleString("vi-VN"),
      currentPrice: Number(data.currentPrice).toLocaleString("vi-VN"),
      productUrl: data.productUrl,
      auctionEndTime: new Date(data.auctionEndTime).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    return sendEmail({
      to: data.previousBidderEmail,
      subject: `Bạn đã bị vượt mức giá hiện tại: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending outbid notification:", error);
  }
};

/**
 * Bid rejected notification
 */
export const sendBidRejectedNotification = async (data) => {
  try {
    const html = await loadTemplate("bid-rejected", {
      bidderName: data.bidderName,
      productTitle: data.productTitle,
      sellerName: data.sellerName,
      reason: data.reason,
      rejectedDate: data.rejectedDate || new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      homeUrl: data.homeUrl,
    });

    return sendEmail({
      to: data.bidderEmail,
      subject: `Lượt đặt giá bị từ chối: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending bid rejected notification:", error);
  }
};

/**
 * Send auction ended no winner notification
 */
export const sendAuctionEndedNoWinnerNotification = async (data) => {
  try {
    const html = await loadTemplate("auction-ended-no-winner", {
      sellerName: data.sellerName,
      productTitle: data.productTitle,
      startPrice: Number(data.startPrice).toLocaleString("vi-VN"),
      startTime: new Date(data.startTime).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      endTime: new Date(data.endTime).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      productUrl: data.productUrl,
    });

    return sendEmail({
      to: data.sellerEmail,
      subject: `Đấu giá kết thúc (Không có người thắng): ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending auction ended no winner notification:", error);
  }
};

/**
 * Send auction ended seller notification
 */
export const sendAuctionEndedSellerNotification = async (data) => {
  try {
    const html = await loadTemplate("auction-ended-seller", {
      sellerName: data.sellerName,
      productTitle: data.productTitle,
      winnerName: data.winnerName,
      winnerEmail: data.winnerEmail,
      winnerPhone: data.winnerPhone,
      finalPrice: Number(data.finalPrice).toLocaleString("vi-VN"),
      startPrice: Number(data.startPrice).toLocaleString("vi-VN"),
      totalBids: data.totalBids,
      endTime: new Date(data.endTime).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      orderUrl: data.orderUrl,
    });

    return sendEmail({
      to: data.sellerEmail,
      subject: `Đấu giá thành công: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending auction ended seller notification:", error);
  }
};

/**
 * Send auction winner notification
 */
export const sendAuctionWinnerNotification = async (data) => {
  try {
    const html = await loadTemplate("auction-winner", {
      winnerName: data.winnerName,
      productTitle: data.productTitle,
      finalPrice: Number(data.finalPrice).toLocaleString("vi-VN"),
      sellerName: data.sellerName,
      sellerEmail: data.sellerEmail,
      sellerPhone: data.sellerPhone,
      totalBids: data.totalBids,
      endTime: new Date(data.endTime).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      orderUrl: data.orderUrl,
    });

    return sendEmail({
      to: data.winnerEmail,
      subject: `Chúc mừng! Bạn đã thắng: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending auction winner notification:", error);
  }
};

/**
 * Send seller answer notification
 */
export const sendSellerAnswerNotification = async (data) => {
  try {
    // Note: This needs to handle multiple recipients if used in a loop or passed a list
    // For now assuming single recipient based on the structure, but we might call this in a loop
    const html = await loadTemplate("seller-answered-notification", {
      participantName: data.participantName,
      productTitle: data.productTitle,
      questionText: data.questionText,
      answerText: data.answerText,
      questionAuthor: data.questionAuthor,
      sellerName: data.sellerName,
      currentPrice: Number(data.currentPrice).toLocaleString("vi-VN"),
      auctionEndTime: new Date(data.auctionEndTime).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      productUrl: data.productUrl,
    });

    return sendEmail({
      to: data.participantEmail,
      subject: `Câu trả lời mới về: ${data.productTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending seller answer notification:", error);
  }
};

/**
 * Verify email configuration
 */
export const verifyEmailConfiguration = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(
      "Email credentials not configured. Email features will be disabled."
    );
    return false;
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("Email server is ready to send messages");
    console.log(`Using: ${process.env.EMAIL_USER}`);
    return true;
  } catch (error) {
    console.error("Email server configuration error:", error.message);
    return false;
  }
};
