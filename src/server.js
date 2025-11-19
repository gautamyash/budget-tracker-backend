import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";

dotenv.config();
await connectDB();

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "https://budget-tracker-frontend-1-dnp4tez2m-gautamyashs-projects.vercel.app"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget", budgetRoutes);

app.get("/", (req, res) => res.send("Budget Tracker API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
