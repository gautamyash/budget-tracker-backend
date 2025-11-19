import express from "express";
import auth from "../middleware/auth.js";
import { setBudget, getBudgetSummary } from "../controllers/budgetController.js";

const router = express.Router();

router.post("/", auth, setBudget);
router.get("/summary", auth, getBudgetSummary);

export default router;
