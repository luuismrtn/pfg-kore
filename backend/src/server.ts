import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routineRoutes from "@backend/routes/routineRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/routines", routineRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "Backend server is running correctly" });
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});

export default app;
