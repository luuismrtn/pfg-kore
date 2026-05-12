import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import routineRoutes from "@backend/routes/routineRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/routines", routineRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "Backend server is running correctly" });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
  });
}

export default app;
