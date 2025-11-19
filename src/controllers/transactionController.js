import Transaction from "../models/Transaction.js";

// Create a new transaction record
export const addTransaction = async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;
    const newTransaction = await Transaction.create({
      user: req.user._id,
      type,
      category,
      amount,
      description,
      date: date || new Date(),
    });
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ message: "Transaction creation failed", error: error.message });
  }
};

// Retrieve all transactions for the authenticated user with optional filtering and pagination
export const getTransactions = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.limit) || 10;
    const skipCount = (currentPage - 1) * itemsPerPage;

    // Construct query filter for the current user
    const queryFilter = { user: req.user._id };
    
    // Add type filter if specified
    if (req.query.type) queryFilter.type = req.query.type;
    
    // Add category filter if specified
    if (req.query.category) queryFilter.category = req.query.category;
    
    // Handle date range filtering
    if (req.query.startDate || req.query.endDate) {
      queryFilter.date = {};
      if (req.query.startDate) {
        queryFilter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endOfDay = new Date(req.query.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        queryFilter.date.$lte = endOfDay;
      }
    }
    
    // Handle amount range filtering
    if (req.query.minAmount || req.query.maxAmount) {
      queryFilter.amount = {};
      if (req.query.minAmount) {
        queryFilter.amount.$gte = parseFloat(req.query.minAmount);
      }
      if (req.query.maxAmount) {
        queryFilter.amount.$lte = parseFloat(req.query.maxAmount);
      }
    }

    // Count total matching documents
    const totalCount = await Transaction.countDocuments(queryFilter);
    
    // Fetch transactions with sorting and pagination
    const transactionList = await Transaction.find(queryFilter)
      .sort({ date: -1 })
      .skip(skipCount)
      .limit(itemsPerPage);

    // Return array directly for dashboard, or paginated response if page param exists
    if (req.query.page) {
      res.json({
        data: transactionList,
        pagination: {
          total: totalCount,
          page: currentPage,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          limit: itemsPerPage
        }
      });
    } else {
      // For dashboard - return array directly
      res.json(transactionList);
    }
  } catch (error) {
    console.error('Transaction fetch error:', error);
    res.status(500).json({ message: "Unable to retrieve transactions", error: error.message });
  }
};

// Calculate transaction statistics and summary
export const getTransactionStats = async (req, res) => {
  try {
    const queryFilter = { user: req.user._id };
    
    // Apply date range if provided
    if (req.query.startDate || req.query.endDate) {
      queryFilter.date = {};
      if (req.query.startDate) queryFilter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const endOfDay = new Date(req.query.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        queryFilter.date.$lte = endOfDay;
      }
    }

    // Calculate income and expense totals
    const [incomeResult, expenseResult] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...queryFilter, type: 'income' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...queryFilter, type: 'expense' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ])
    ]);

    // Get expense breakdown by category
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { ...queryFilter, type: 'expense' } },
      { $group: { _id: '$category', sum: { $sum: '$amount' } } },
      { $sort: { sum: -1 } }
    ]);

    const totalIncome = incomeResult[0]?.sum || 0;
    const totalExpense = expenseResult[0]?.sum || 0;

    res.json({
      income: totalIncome,
      expenses: totalExpense,
      balance: totalIncome - totalExpense,
      categories: categoryBreakdown
    });
  } catch (error) {
    console.error('Statistics calculation error:', error);
    res.status(500).json({ message: 'Unable to calculate statistics', error: error.message });
  }
};

// Retrieve distinct category list
export const getCategories = async (req, res) => {
  try {
    const uniqueCategories = await Transaction.distinct('category', { user: req.user._id });
    res.json(uniqueCategories);
  } catch (error) {
    console.error('Category retrieval error:', error);
    res.status(500).json({ message: 'Unable to fetch categories', error: error.message });
  }
};

// Modify existing transaction
export const updateTransaction = async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;
    const existingTransaction = await Transaction.findById(req.params.id);
    
    if (!existingTransaction) return res.status(404).json({ message: "Transaction not found" });
    if (existingTransaction.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });

    // Apply updates
    if (type) existingTransaction.type = type;
    if (category) existingTransaction.category = category;
    if (amount) existingTransaction.amount = amount;
    if (description !== undefined) existingTransaction.description = description;
    if (date) existingTransaction.date = date;

    await existingTransaction.save();
    res.json(existingTransaction);
  } catch (error) {
    console.error('Transaction update error:', error);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// Remove transaction record
export const deleteTransaction = async (req, res) => {
  try {
    const targetTransaction = await Transaction.findById(req.params.id);
    if (!targetTransaction) return res.status(404).json({ message: "Transaction not found" });
    if (targetTransaction.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });

    await targetTransaction.deleteOne();
    res.json({ message: "Transaction removed successfully" });
  } catch (error) {
    console.error('Transaction deletion error:', error);
    res.status(500).json({ message: "Deletion failed", error: error.message });
  }
};
