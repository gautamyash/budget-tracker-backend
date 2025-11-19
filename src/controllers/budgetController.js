import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

// Create or modify budget allocation
export const setBudget = async (req, res) => {
  try {
    const { month, year, amount } = req.body;
    let budgetRecord = await Budget.findOne({ user: req.user._id, month, year });
    if (budgetRecord) {
      budgetRecord.amount = amount;
      await budgetRecord.save();
    } else {
      budgetRecord = await Budget.create({ user: req.user._id, month, year, amount });
    }
    res.status(201).json(budgetRecord);
  } catch (error) {
    res.status(500).json({ message: "Budget operation failed", error: error.message });
  }
};

// Retrieve budget summary with expense calculations
export const getBudgetSummary = async (req, res) => {
  try {
    // Use current month/year if not provided
    const currentDate = new Date();
    const targetMonth = req.query.month ? parseInt(req.query.month) : currentDate.getMonth() + 1;
    const targetYear = req.query.year ? parseInt(req.query.year) : currentDate.getFullYear();
    
    // Find budget for specified period
    const budgetRecord = await Budget.findOne({ 
      user: req.user._id, 
      month: targetMonth, 
      year: targetYear 
    });
    
    // Calculate date range for the month
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    
    // Fetch all expenses for the period
    const expenseList = await Transaction.find({
      user: req.user._id,
      type: "expense",
      date: {
        $gte: monthStart,
        $lte: monthEnd
      }
    });

    // Calculate total expenses
    const expenseSum = expenseList.reduce((accumulator, transaction) => 
      accumulator + transaction.amount, 0
    );
    
    const budgetAmount = budgetRecord ? budgetRecord.amount : 0;
    
    res.json({
      budget: budgetAmount,
      totalExpenses: expenseSum,
      balance: budgetAmount - expenseSum
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch budget summary", error: error.message });
  }
};
