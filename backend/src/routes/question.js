import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createQuestion,
  getQuestionsProduct,
  answerQuestion,
  deleteQuestion,
} from "../controllers/question.js";

const router = express.Router();

router.get("/product/:productId", getQuestionsProduct);
    
router.use(authenticate);

router.post("/", createQuestion);
router.post("/:questionId/answer", answerQuestion);
router.delete("/:questionId", deleteQuestion);

export default router;    