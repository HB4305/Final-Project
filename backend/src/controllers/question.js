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

    const productUrl = `${process.env.FRONTEND_URL}/product/${productId}`;

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
      .populate({
        path: "productId",
        select: "sellerId title",
        populate: {
          path: "sellerId",
          select: "email fullName",
        },
      })
      .populate("authorId", "email fullName");

    if (!question) {
      throw new AppError("Question not found", 404);
    }

    const sellerId = question.productId.sellerId._id.toString();
    const questionAuthorId = question.authorId._id.toString();

    if (sellerId !== userId.toString() && questionAuthorId !== userId.toString()) {
      throw new AppError("You are not authorized to answer this question", 403);
    }

    const user = await User.findById(userId, "fullName");

    question.answers.push({
      authorId: userId,
      text: text.trim(),
      createdAt: new Date(),
    });

    if (sellerId === userId.toString()) {
        question.status = "answered";
    } else {
        question.status = "open"; 
    }
    
    await question.save();

    await question.populate("answers.authorId", "fullName");

    const baseUrl = process.env.FRONTEND_URL;
    const productUrl = `${baseUrl}/product/${question.productId._id}`;

    if (sellerId === userId.toString()) {
        await sendAnswerNotification({
          buyerEmail: question.authorId.email,
          buyerName: question.authorId.fullName,
          productTitle: question.productId.title,
          questionText: question.text,
          answerText: text.trim(),
          productUrl,
        });

        (async () => {
          try {
            const bids = await Bid.find({ productId: question.productId._id }).distinct('bidderId');
            const questions = await Question.find({ productId: question.productId._id }).distinct('authorId');
            const interestedUserIds = [...new Set([...bids.map(id => id.toString()), ...questions.map(id => id.toString())])];
            
            const recipients = interestedUserIds.filter(id =>
              id !== questionAuthorId &&
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

    } else {
        await sendQuestionNotification({
          sellerEmail: question.productId.sellerId.email,
          sellerName: question.productId.sellerId.fullName,
          productTitle: question.productId.title,
          buyerName: user.fullName,
          questionText: text.trim(), // The new reply
          productUrl,
        });
    }

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
