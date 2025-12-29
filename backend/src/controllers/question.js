import { Question, Product, User, Bid, Auction } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { NotificationService } from "../services/NotificationService.js";
import {
  sendAnswerNotification,
  sendQuestionNotification,
  sendSellerAnswerNotification,
} from "../utils/email.js";

export const createQuestion = async (req, res, next) => {
  try {
    const { productId, content } = req.body;
    const userId = req.user._id;

    if (!productId || !content?.trim()) {
      throw new AppError("Product ID and content are required", 400);
    }

    const product = await Product.findById(productId).populate(
      "sellerId",
      "email fullName"
    );

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (product.sellerId._id.toString() === userId.toString()) {
      throw new AppError(
        "You cannot ask a question about your own product",
        403
      );
    }

    const question = await Question.create({
      productId,
      authorId: userId,
      text: content.trim(),
      status: "open",
    });

    await question.populate("authorId", "fullName email");

    const productUrl = `${process.env.FRONTEND_BASE_URL}/products/${productId}`;

    // Send email notification using template
    await sendQuestionNotification({
      sellerEmail: product.sellerId.email,
      sellerName: product.sellerId.fullName,
      productTitle: product.title,
      buyerName: question.authorId.fullName,
      questionText: question.text,
      productUrl,
    });

    // TODO: Create notification
    // await NotificationService.createNotification({
    //   userId: product.sellerId._id,
    //   type: "question",
    //   title: "New Question about Product",
    //   message: `${question.authorId.fullName} asked about "${product.title}"`,
    //   relatedId: question._id,
    //   link: `/products/${productId}`,
    // });

    res.status(201).json({
      success: true,
      message: "Question sent successfully",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách câu hỏi của một sản phẩm
 * @route   GET /api/questions/product/:productId
 * @access  Public
 */

export const getQuestionsProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const questions = await Question.find({ productId })
      .populate("authorId", "fullName avatar")
      .populate("answers.authorId", "fullName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments({ productId });

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trả lời câu hỏi
 * @route   POST /api/questions/:questionId/answer
 * @access  Private (Seller)
 */

export const answerQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text?.trim()) {
      throw new AppError("Content cannot be empty", 400);
    }

    const question = await Question.findById(questionId)
      .populate("productId", "sellerId title")
      .populate("authorId", "email fullName");

    if (!question) {
      throw new AppError("Question not found", 404);
    }

    if (question.productId.sellerId.toString() !== userId.toString()) {
      throw new AppError("You are not authorized to answer this question", 403);
    }

    const user = await User.findById(userId, "fullName");

    question.answers.push({
      authorId: userId,
      text: text.trim(),
      createdAt: new Date(),
    });

    question.status = "answered";
    await question.save();
    
    // Populate answer author for response
    await question.populate("answers.authorId", "fullName");

    const productUrl = `${process.env.FRONTEND_BASE_URL}/products/${question.productId._id}`;

    // Send answer notification email
    await sendAnswerNotification({
      buyerEmail: question.authorId.email,
      buyerName: question.authorId.fullName,
      productTitle: question.productId.title,
      answerText: text.trim(),
      productUrl,
    });

    // Send notification to other interested users (Bidders + Other Askers)
    (async () => {
        try {
            // Find all bidders for this product
            const bids = await Bid.find({ productId: question.productId._id }).distinct('bidderId');
            
            // Find all users who asked questions about this product
            const questions = await Question.find({ productId: question.productId._id }).distinct('authorId');

            // Combine and unique
            const interestedUserIds = [...new Set([...bids.map(id => id.toString()), ...questions.map(id => id.toString())])];

            // Filter out current question author (already notified) and seller (who is answering)
            const recipients = interestedUserIds.filter(id => 
                id !== question.authorId._id.toString() && 
                id !== userId.toString()
            );

            if (recipients.length > 0) {
                 const users = await User.find({ _id: { $in: recipients } });
                 const auction = await Auction.findOne({ productId: question.productId._id, status: 'active' });

                 for (const recipient of users) {
                     await sendSellerAnswerNotification({
                        participantEmail: recipient.email,
                        participantName: recipient.fullName,
                        productTitle: question.productId.title,
                        questionText: question.text,
                        answerText: text.trim(),
                        questionAuthor: question.authorId.fullName,
                        sellerName: user.fullName,
                        currentPrice: auction ? auction.currentPrice : 'N/A',
                        auctionEndTime: auction ? auction.endAt : null,
                        productUrl
                     });
                 }
            }

        } catch (err) {
            console.error("Error sending seller answer notifications:", err);
        }
    })();

    // TODO: Create notification
    // await NotificationService.createNotification({
    //   userId: question.authorId._id,
    //   type: "answer",
    //   title: "Your Question Has Been Answered",
    //   message: `Your question about "${question.productId.title}" has been answered.`,
    //   relatedId: question._id,
    //   link: `/products/${question.productId._id}`,
    // });

    res.json({
      success: true,
      message: "Answer submitted successfully",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa câu hỏi (chỉ người hỏi hoặc admin)
 * @route   DELETE /api/questions/:questionId
 * @access  Private
 */

export const deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const question = await Question.findById(questionId);

    if (!question) {
      throw new AppError("Question not found", 404);
    }

    if (
      question.authorId.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      throw new AppError("You are not authorized to delete this question", 403);
    }

    await question.deleteOne();

    res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
