import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ReqForm {
  text: string;
  name: string;
  weightKg: number | "";
  heightCm: number | "";
  sport: string;
  availableDays: number;
  averageDurationMinutes: number;
  equipment: string[];
  injuries: string[];
}

interface EjercicioFiltro {
  id: string;
  nombre: string;
  grupo_muscular: string;
  tipo_mecanica: string;
}

export class RagService {
  private openai: OpenAI;
  private ejerciciosBD: any[];

  constructor() {
    const baseURL =
      process.env.OLLAMA_BASE_URL ||
      process.env.OLLAMA_URL ||
      "http://127.0.0.1:11434/v1";
    const apiKey =
      process.env.OLLAMA_API_KEY || process.env.OLLAMA_KEY || "ollama";

    this.openai = new OpenAI({
      baseURL,
      apiKey,
    });

    const dataPath = path.join(__dirname, "../data/musculacion.json");
    try {
      const fileData = fs.readFileSync(dataPath, "utf-8");
      this.ejerciciosBD = JSON.parse(fileData);
    } catch (error) {
      console.error("Error al cargar el dataset de musculación:", error);
      this.ejerciciosBD = [];
    }
  }

  private filtrarEjercicios(req: ReqForm): EjercicioFiltro[] {
    const injuries = Array.isArray(req?.injuries) ? req.injuries : [];
    const equipment = Array.isArray(req?.equipment) ? req.equipment : [];

    return this.ejerciciosBD
      .filter((ej) => {
        const tieneLesion = ej.lesiones_prohibidas?.some((lesion: string) =>
          injuries.includes(lesion),
        );
        if (tieneLesion) return false;

        const faltaMaterial = ej.equipamiento?.some(
          (item: string) =>
            item !== "Peso Corporal" && !equipment.includes(item),
        );
        if (faltaMaterial) return false;

        return true;
      })
      .map((ej) => ({
        id: ej.id,
        nombre: ej.nombre,
        grupo_muscular: ej.grupo_muscular,
        tipo_mecanica: ej.tipo_mecanica,
      }));
  }

  public async generarRutina(request: ReqForm): Promise<any> {
    console.log("Iniciando generación de rutina...");

    const normalizedRequest: ReqForm = {
      text: request?.text ?? "",
      name: request?.name ?? "",
      weightKg: request?.weightKg ?? "",
      heightCm: request?.heightCm ?? "",
      sport: request?.sport ?? "",
      availableDays: Number(request?.availableDays) || 3,
      averageDurationMinutes: Number(request?.averageDurationMinutes) || 60,
      equipment: Array.isArray(request?.equipment) ? request.equipment : [],
      injuries: Array.isArray(request?.injuries) ? request.injuries : [],
    };

    const ejerciciosValidos = this.filtrarEjercicios(normalizedRequest);
    const contextoEjercicios = JSON.stringify(ejerciciosValidos);

    const systemPrompt = `
    \nEres un entrenador personal experto en ciencias del deporte.
    \nTu tarea es crear una rutina de ejercicios estructurada en formato JSON estricto.
    
    \n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):
    \n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios válidos.
    \n   Si inventas un ejercicio o usas uno fuera de esta lista, el sistema fallará.
    \n2. La rutina debe ser de ${normalizedRequest.availableDays} días.
    \n3. Devuelve ÚNICAMENTE código JSON válido, sin texto adicional antes o después.
    
    \n\nLISTA DE EJERCICIOS VÁLIDOS PARA ESTE USUARIO:
    \n${contextoEjercicios}
    
    \n\nFORMATO JSON REQUERIDO:
    \n{
    \n  "rutina": [
    \n    {
    \n      "dia": "Día 1 - Pecho y Tríceps",
    \n      "ejercicios": [
    \n        {
    \n          "ejercicio_id": "musc_001",
    \n          "nombre": "Press de Banca",
    \n          "series": 4,
    \n          "repeticiones": "8-12",
    \n          "descanso_segundos": 90,
    \n          "nota": "Controlar excéntrica"
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n
    `;

    console.log(normalizedRequest);

    try {
      console.log("Contactando con LLM local (Ollama)...");
      const response = await this.openai.chat.completions.create({
        model: "llama3.1",
        response_format: { type: "json_object" },
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Genera una rutina de ejercicios para el siguiente perfil:\n${JSON.stringify(normalizedRequest)}. Además, ten en cuenta el texto que nos propocionado: "${normalizedRequest.text}"`,
          },
        ],
      });

      const firstChoice = response.choices[0];

      const iaResponseText = firstChoice?.message?.content;
      if (!iaResponseText) throw new Error("Respuesta vacía de la IA");

      console.log("Rutina generada con éxito.");
      return JSON.parse(iaResponseText as unknown as string);
    } catch (error) {
      const e = error as any;
      console.error("Error en el servicio RAG:", e?.message || e);
      if (
        e?.code === "ECONNREFUSED" ||
        (e?.message && e.message.includes("ECONNREFUSED"))
      ) {
        throw new Error(
          `No se pudo conectar con el LLM en la URL configurada. Comprueba que Ollama esté en ejecución y que OLLAMA_BASE_URL apunte a la dirección correcta. (${process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || "http://127.0.0.1:11434/v1"})`,
        );
      }

      throw new Error("Fallo al generar la rutina con la IA.");
    }
  }
}
