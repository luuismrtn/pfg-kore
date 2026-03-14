import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rutinaRoutes from "./routes/rutinaRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/rutinas", rutinaRoutes);

app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "Servidor Backend funcionando correctamente" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend escuchando en http://localhost:${PORT}`);
  console.log(
    "Recuerda tener Ollama ejecutándose en tu PC para la generación de IA.",
  );
});

export default app;
