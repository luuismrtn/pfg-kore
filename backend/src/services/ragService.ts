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
  level: string;
}

interface EjercicioFiltro {
  id: string;
  nombre: string;
  grupo_muscular: string;
  tipo_mecanica: string;
  patron_movimiento: string;
}

interface EjercicioBD {
  id: string;
  nombre: string;
  nivel_dificultad?: string;
  equipamiento?: string[];
  lesiones_prohibidas?: string[];
  atributos_especificos?: {
    grupo_muscular?: string;
    tipo_mecanica?: string;
    patron_movimiento?: string;
  };
}

export class RagService {
  private openai: OpenAI;
  private ejerciciosBD: EjercicioBD[];

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

  private normalizarTexto(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  private filtrarPorNivel(
    exercises: EjercicioBD[],
    level: string,
  ): EjercicioBD[] {
    const nivel = this.normalizarTexto(level);

    let nivelesPermitidos: string[] = ["principiante"];
    if (nivel === "2" || nivel.includes("intermedio")) {
      nivelesPermitidos = ["principiante", "intermedio"];
    } else if (nivel === "3" || nivel.includes("avanzado")) {
      nivelesPermitidos = ["principiante", "intermedio", "avanzado"];
    }

    const nivelesPermitidosSet = new Set(nivelesPermitidos);

    return exercises.filter((ejercicio) => {
      const nivelEjercicio = this.normalizarTexto(
        ejercicio.nivel_dificultad ?? "Principiante",
      );
      return nivelesPermitidosSet.has(nivelEjercicio);
    });
  }

  private filtrarPorLesiones(
    exercises: EjercicioBD[],
    injuries: string[],
  ): EjercicioBD[] {
    const lesionesUsuario = new Set(
      injuries.map((lesion) => this.normalizarTexto(lesion)),
    );

    if (lesionesUsuario.size === 0) {
      return exercises;
    }

    return exercises.filter((ejercicio) => {
      const lesionesProhibidas = (ejercicio.lesiones_prohibidas ?? []).map(
        (lesion) => this.normalizarTexto(lesion),
      );

      return !lesionesProhibidas.some((lesion) => lesionesUsuario.has(lesion));
    });
  }

  private filtrarPorMaterial(
    exercises: EjercicioBD[],
    equipment: string[],
  ): EjercicioBD[] {
    const equipamientoUsuario = new Set(
      equipment.map((item) => this.normalizarTexto(item)),
    );

    equipamientoUsuario.add("peso corporal");

    return exercises.filter((ejercicio) => {
      const equipamientoNecesario = (ejercicio.equipamiento ?? []).map((item) =>
        this.normalizarTexto(item),
      );

      if (equipamientoNecesario.length === 0) {
        return true;
      }

      return equipamientoNecesario.every((item) =>
        equipamientoUsuario.has(item),
      );
    });
  }

  private filtrarEjercicios(req: ReqForm): EjercicioFiltro[] {
    const exercises = this.ejerciciosBD;

    const ejerciciosPorNivel = this.filtrarPorNivel(exercises, req.level);
    const ejerciciosSinLesiones = this.filtrarPorLesiones(
      ejerciciosPorNivel,
      req.injuries,
    );
    const ejerciciosValidos = this.filtrarPorMaterial(
      ejerciciosSinLesiones,
      req.equipment,
    );

    return ejerciciosValidos.map((ej) => ({
      id: ej.id,
      nombre: ej.nombre,
      grupo_muscular:
        ej.atributos_especificos?.grupo_muscular || "Sin especificar",
      tipo_mecanica:
        ej.atributos_especificos?.tipo_mecanica || "Sin especificar",
      patron_movimiento:
        ej.atributos_especificos?.patron_movimiento || "Sin especificar",
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
      level: request?.level ?? "Principiante",
    };

    const ejerciciosValidos = this.filtrarEjercicios(normalizedRequest);
    const contextoEjercicios = JSON.stringify(ejerciciosValidos);

    const systemPrompt = `
    \nEres un entrenador personal experto en ciencias del deporte.
    \nTu tarea es crear una rutina de ejercicios estructurada en formato JSON estricto.
    
    \n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):
    \n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios válidos.
    \n   Si inventas un ejercicio o usas uno fuera de esta lista, el sistema fallará.
    \n2. La rutina debe ser de ${normalizedRequest.availableDays} días. El objetivo es cubrir todo el cuerpo de manera equilibrada, pero puedes enfocarte más en las preferencias del usuario si las hay. Cada día debe tener un enfoque claro (ej. "Día 1 - Pecho y Tríceps").
    \n3. Devuelve ÚNICAMENTE código JSON válido, sin texto adicional antes o después.
    \n4. El tiempo medio de entrenamiento por día debe ser de aproximadamente ${normalizedRequest.averageDurationMinutes} minutos. Ajusta el número de ejercicios, series y repeticiones (si puede ser un número exacto de repeticiones mejor o también es válido poner como repeticiones "FALLO" para que el usuario haga el máximo de repeticiones) para cumplir con este tiempo.
    
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
    \n          "series": 3,
    \n          "repeticiones": "10",
    \n          "descanso_segundos": 90,
    \n          "nota": "Controlar excéntrica"
    \n          "badges": ["Pecho", "Hombro"]
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n
    `;

    console.log(normalizedRequest);
    console.log("Contexto de ejercicios filtrados:", contextoEjercicios);

    /*

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
      */
  }
}
