import express from "express";
import auth from "../middleware/auth.js";
import {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getCategories
} from "../controllers/transactionController.js";

const router = express.Router();

// Transaction CRUD operations
router.post("/", auth, addTransaction);
router.get("/", auth, getTransactions);
router.put("/:id", auth, updateTransaction);
router.delete("/:id", auth, deleteTransaction);

// Transaction statistics and analytics
router.get("/stats", auth, getTransactionStats);
router.get("/categories", auth, getCategories);

export default router;
