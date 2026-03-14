import OpenAI from "openai";
import fs from "fs";
import path from "path";

export interface PerfilUsuario {
  objetivo: string;
  nivel: string;
  lesiones: string[];
  equipamiento: string[];
  dias_semana: number;
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
    this.openai = new OpenAI({
      baseURL: "http://127.0.0.1:11434/v1",
      apiKey: "ollama",
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

  private filtrarEjercicios(perfil: PerfilUsuario): EjercicioFiltro[] {
    return this.ejerciciosBD
      .filter((ej) => {
        const tieneLesion = ej.lesiones_prohibidas?.some((lesion: string) =>
          perfil.lesiones.includes(lesion),
        );
        if (tieneLesion) return false;

        const faltaMaterial = ej.equipamiento?.some(
          (item: string) =>
            item !== "Peso Corporal" && !perfil.equipamiento.includes(item),
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

  public async generarRutina(perfil: PerfilUsuario) {
    console.log("Iniciando generación de rutina...");
    const ejerciciosValidos = this.filtrarEjercicios(perfil);
    const contextoEjercicios = JSON.stringify(ejerciciosValidos);

    const systemPrompt = `\nEres un entrenador personal experto en ciencias del deporte.\nTu tarea es crear una rutina de ejercicios estructurada en formato JSON estricto.\n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):\n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios válidos.\n   Si inventas un ejercicio o usas uno fuera de esta lista, el sistema fallará.\n2. La rutina debe ser de ${perfil.dias_semana} días.\n3. Devuelve ÚNICAMENTE código JSON válido, sin texto adicional antes o después.\n\nLISTA DE EJERCICIOS VÁLIDOS PARA ESTE USUARIO:\n${contextoEjercicios}\n\nFORMATO JSON REQUERIDO:\n{\n  "rutina": [\n    {\n      "dia": "Día 1 - Pecho y Tríceps",\n      "ejercicios": [\n        {\n          "ejercicio_id": "musc_001",\n          "nombre": "Press de Banca",\n          "series": 4,\n          "repeticiones": "8-12",\n          "descanso_segundos": 90,\n          "nota": "Controlar excéntrica"\n        }\n      ]\n    }\n  ]\n}\n`;

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
            content: `Genera una rutina para objetivo: ${perfil.objetivo}, nivel: ${perfil.nivel}.`,
          },
        ],
      });

      const iaResponseText = response.choices[0].message.content;
      if (!iaResponseText) throw new Error("Respuesta vacía de la IA");

      console.log("Rutina generada con éxito.");
      return JSON.parse(iaResponseText as unknown as string);
    } catch (error) {
      console.error("Error en el servicio RAG:", error);
      throw new Error("Fallo al generar la rutina con la IA.");
    }
  }
}
