import { Question, Product, User } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { NotificationService } from "../services/NotificationService.js";
import {
  sendAnswerNotification,
  sendQuestionNotification,
} from "../utils/email.js";

export const createQuestion = async (req, res, next) => {
  try {
    const { productId, content } = req.body;
    const userId = req.user.id;

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

    // Create notification
    await NotificationService.createNotification({
      userId: product.sellerId._id,
      type: "question",
      title: "New Question about Product",
      message: `${question.authorId.fullName} asked about "${product.title}"`,
      relatedId: question._id,
      link: `/products/${productId}`,
    });

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
      .populate("answer.authorId", "fullName avatar")
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

    question.answer.push({
      authorId: userId,
      text: text.trim(),
      createdAt: new Date(),
    });

    question.status = "answered";
    await question.save();

    const productUrl = `${process.env.FRONTEND_BASE_URL}/products/${question.productId._id}`;

    // Send answer notification email
    await sendAnswerNotification({
      buyerEmail: question.authorId.email,
      buyerName: question.authorId.fullName,
      productTitle: question.productId.title,
      answerText: text.trim(),
      productUrl,
    });

    await NotificationService.createNotification({
      userId: question.authorId._id,
      type: "answer",
      title: "Your Question Has Been Answered",
      message: `Your question about "${question.productId.title}" has been answered.`,
      relatedId: question._id,
      link: `/products/${question.productId._id}`,
    });

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
