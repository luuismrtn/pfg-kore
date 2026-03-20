import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ExerciseRecord, FilteredExercise } from "@backend/types/exercise";
import type {
  ChangeRoutineExerciseRequest,
  ChangeRoutineDayRequest,
  RoutineDay,
  RoutineRequest,
  RoutineResponse,
} from "@backend/types/routine";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RagService {
  private openai: OpenAI;
  private exercisesDb: ExerciseRecord[];

  constructor() {
    const baseURL = "http://127.0.0.1:11434/v1";
    const apiKey = "ollama";

    this.openai = new OpenAI({
      baseURL,
      apiKey,
    });

    const dataPath = path.join(__dirname, "../data/musculacion.json");
    try {
      const fileData = fs.readFileSync(dataPath, "utf-8");
      this.exercisesDb = JSON.parse(fileData);
    } catch (error) {
      console.error("Error loading strength training dataset:", error);
      this.exercisesDb = [];
    }
  }

  private normalizeText(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  private filterByLevel(
    exercises: ExerciseRecord[],
    level: string,
  ): ExerciseRecord[] {
    const normalizedLevel = this.normalizeText(level);

    let allowedLevels: string[] = ["principiante"];
    if (normalizedLevel === "2" || normalizedLevel.includes("intermedio")) {
      allowedLevels = ["principiante", "intermedio"];
    } else if (
      normalizedLevel === "3" ||
      normalizedLevel.includes("avanzado")
    ) {
      allowedLevels = ["principiante", "intermedio", "avanzado"];
    }

    const allowedLevelsSet = new Set(allowedLevels);

    return exercises.filter((exercise) => {
      const exerciseLevel = this.normalizeText(
        exercise.nivel_dificultad ?? "Principiante",
      );
      return allowedLevelsSet.has(exerciseLevel);
    });
  }

  private filterByInjuries(
    exercises: ExerciseRecord[],
    injuries: string[],
  ): ExerciseRecord[] {
    const userInjuries = new Set(
      injuries.map((injury) => this.normalizeText(injury)),
    );

    if (userInjuries.size === 0) {
      return exercises;
    }

    return exercises.filter((exercise) => {
      const restrictedInjuries = (exercise.lesiones_prohibidas ?? []).map(
        (injury: string) => this.normalizeText(injury),
      );

      return !restrictedInjuries.some((injury: string) =>
        userInjuries.has(injury),
      );
    });
  }

  private filterByEquipment(
    exercises: ExerciseRecord[],
    equipment: string[],
    weightKg: number,
  ): ExerciseRecord[] {
    const userEquipment = new Set(
      equipment.map((item) => this.normalizeText(item)),
    );

    if (weightKg > 0 && weightKg < 80) {
      userEquipment.add("peso corporal");
    }

    return exercises.filter((exercise) => {
      const requiredEquipment = (exercise.equipamiento ?? []).map(
        (item: string) => this.normalizeText(item),
      );

      if (requiredEquipment.length === 0) {
        return true;
      }

      return requiredEquipment.every((item: string) => userEquipment.has(item));
    });
  }

  private filterExercises(request: RoutineRequest): FilteredExercise[] {
    const exercises = this.exercisesDb;

    const levelFiltered = this.filterByLevel(exercises, request.level);
    const injuryFiltered = this.filterByInjuries(
      levelFiltered,
      request.injuries,
    );
    const validExercises = this.filterByEquipment(
      injuryFiltered,
      request.equipment,
      request.weightKg as number,
    );

    return validExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.nombre,
      muscleGroup:
        exercise.atributos_especificos?.grupo_muscular || "Sin especificar",
      mechanicType:
        exercise.atributos_especificos?.tipo_mecanica || "Sin especificar",
      movementPattern:
        exercise.atributos_especificos?.patron_movimiento || "Sin especificar",
    }));
  }

  private mapToFilteredExercises(
    exercises: ExerciseRecord[],
  ): FilteredExercise[] {
    return exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.nombre,
      muscleGroup:
        exercise.atributos_especificos?.grupo_muscular || "Sin especificar",
      mechanicType:
        exercise.atributos_especificos?.tipo_mecanica || "Sin especificar",
      movementPattern:
        exercise.atributos_especificos?.patron_movimiento || "Sin especificar",
    }));
  }

  private async generateJsonFromModel(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<Record<string, unknown>> {
    console.log("SystemPrompt: ", systemPrompt);
    console.log("userPrompt: ", userPrompt);

    /*
    try {
      console.log("Connecting to local LLM (Ollama)...");
      const response = await this.openai.chat.completions.create({
        model: "llama3.1",
        response_format: { type: "json_object" },
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const modelOutput = response.choices[0]?.message?.content;
      if (!modelOutput) {
        throw new Error("Empty response from AI model.");
      }

      return JSON.parse(modelOutput) as Record<string, unknown>;
    } catch (error) {
      const e = error as { code?: string; message?: string };
      console.error("Error in RAG service:", e?.message || e);
      if (
        e?.code === "ECONNREFUSED" ||
        (e?.message && e.message.includes("ECONNREFUSED"))
      ) {
        throw new Error(
          `Could not connect to the configured LLM URL. Verify Ollama is running and OLLAMA_BASE_URL is correct. (${process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || "http://127.0.0.1:11434/v1"})`,
        );
      }

      throw new Error("Failed to generate routine with AI.");
    }
    */

    throw new Error("AI model integration is not enabled yet.");
  }

  private resolveDayIndex(
    routine: RoutineResponse,
    dayToChange: string,
  ): number {
    const numericDay = Number(dayToChange);
    if (
      !Number.isNaN(numericDay) &&
      numericDay >= 1 &&
      numericDay <= routine.routine.length
    ) {
      return numericDay - 1;
    }

    const normalizedTarget = this.normalizeText(dayToChange);
    return routine.routine.findIndex(
      (day) => this.normalizeText(day.day) === normalizedTarget,
    );
  }

  private resolveExerciseIndex(
    day: RoutineDay,
    exerciseToChange: string,
  ): number {
    const numericExercise = Number(exerciseToChange);
    if (
      !Number.isNaN(numericExercise) &&
      numericExercise >= 1 &&
      numericExercise <= day.exercises.length
    ) {
      return numericExercise - 1;
    }

    const normalizedTarget = this.normalizeText(exerciseToChange);
    return day.exercises.findIndex((exercise) => {
      const byName = this.normalizeText(exercise.name) === normalizedTarget;
      const byId = this.normalizeText(exercise.exerciseId) === normalizedTarget;
      return byName || byId;
    });
  }

  private normalizeProfile(profile?: Partial<RoutineRequest>): RoutineRequest {
    return {
      text: profile?.text ?? "",
      name: profile?.name ?? "",
      weightKg: profile?.weightKg ?? "",
      heightCm: profile?.heightCm ?? "",
      sport: profile?.sport ?? "",
      availableDays: Number(profile?.availableDays) || 3,
      averageDurationMinutes: Number(profile?.averageDurationMinutes) || 60,
      equipment: Array.isArray(profile?.equipment) ? profile.equipment : [],
      injuries: Array.isArray(profile?.injuries) ? profile.injuries : [],
      level: profile?.level ?? "Principiante",
    };
  }

  private extractRoutineResponse(
    modelResponse: Record<string, unknown>,
  ): RoutineResponse {
    const routine = modelResponse.routine;
    if (!Array.isArray(routine)) {
      throw new Error("AI response does not contain a valid routine array.");
    }

    return {
      routine: routine as RoutineResponse["routine"],
    };
  }

  public async generateRoutine(
    request: RoutineRequest,
  ): Promise<RoutineResponse> {
    console.log("Starting routine generation...");

    const normalizedRequest: RoutineRequest = {
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

    const validExercises = this.filterExercises(normalizedRequest);
    const exerciseContext = JSON.stringify(validExercises);

    console.log("Valid exercises for this user:", validExercises);

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
    \n${exerciseContext}
    
    \n\nFORMATO JSON REQUERIDO:
    \n{
    \n  "routine": [
    \n    {
    \n      "day": "Día 1 - Pecho y Tríceps",
    \n      "exercises": [
    \n        {
    \n          "exerciseId": "musc_001",
    \n          "name": "Press de Banca",
    \n          "sets": 3,
    \n          "reps": "10",
    \n          "restSeconds": 90,
    \n          "note": "Controlar excéntrica"
    \n          "badges": ["Pecho", "Hombro"]
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n`;

    const response = await this.generateJsonFromModel(
      systemPrompt,
      `Generate a routine for this user profile: ${JSON.stringify(normalizedRequest)}. Additional user request: "${normalizedRequest.text}".`,
    );

    return response as unknown as RoutineResponse;
  }

  public async changeRoutineDay(
    request: ChangeRoutineDayRequest,
  ): Promise<RoutineResponse> {
    const currentRoutine = request.routine;
    const dayIndex = this.resolveDayIndex(currentRoutine, request.dayToChange);

    if (dayIndex < 0) {
      throw new Error(
        "The dayToChange value does not match any day in the routine.",
      );
    }

    const normalizedProfile = request.profile
      ? this.normalizeProfile(request.profile)
      : undefined;

    const validExercises = normalizedProfile
      ? this.filterExercises(normalizedProfile)
      : this.mapToFilteredExercises(this.exercisesDb);

    const exerciseContext = JSON.stringify(validExercises);
    const targetDay = currentRoutine.routine[dayIndex];
    if (!targetDay) {
      throw new Error("Could not resolve the target day to replace.");
    }

    const changeText = request.changeRequest ?? "";

    const systemPrompt = `
    \nEres un entrenador personal experto en ciencias del deporte.
    \nTu tarea es regenerar la rutina completa, cambiando el dia objetivo y manteniendo coherencia con el resto de dias.

    \n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):
    \n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios validos.
    \n2. NO repitas exactamente el mismo contenido del dia que se reemplaza, salvo que sea estrictamente necesario.
    \n3. Debes respetar la logica de recuperacion muscular frente al resto de dias ya existentes.
    \n4. Debes devolver SIEMPRE la rutina COMPLETA en formato {"routine":[...]}, no solo un dia.
    \n5. Devuelve UNICAMENTE JSON valido, sin texto adicional.

    \n\nLISTA DE EJERCICIOS VALIDOS PARA ESTE USUARIO:
    \n${exerciseContext}

    \n\nFORMATO JSON REQUERIDO:
    \n{
    \n  "routine": [
    \n    {
    \n      "day": "Día 1 - Pecho y Tríceps",
    \n      "exercises": [
    \n        {
    \n          "exerciseId": "musc_001",
    \n          "name": "Press de Banca",
    \n          "sets": 3,
    \n          "reps": "10",
    \n          "restSeconds": 90,
    \n          "note": "Controlar excéntrica"
    \n          "badges": ["Pecho", "Hombro"]
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n`;

    const modelResponse = await this.generateJsonFromModel(
      systemPrompt,
      `Rutina actual completa: ${JSON.stringify(currentRoutine)}. Dia a reemplazar: "${targetDay.day}". Indice del dia (1-based): ${dayIndex + 1}. Solicitud adicional del usuario: "${changeText}". Devuelve la rutina completa actualizada cambiando ese dia.`,
    );

    return this.extractRoutineResponse(modelResponse);
  }

  public async changeRoutineExercise(
    request: ChangeRoutineExerciseRequest,
  ): Promise<RoutineResponse> {
    const currentRoutine = request.routine;
    const dayIndex = this.resolveDayIndex(currentRoutine, request.dayToChange);

    if (dayIndex < 0) {
      throw new Error(
        "The dayToChange value does not match any day in the routine.",
      );
    }

    const targetDay = currentRoutine.routine[dayIndex];
    if (!targetDay) {
      throw new Error("Could not resolve the target day.");
    }

    const exerciseIndex = this.resolveExerciseIndex(
      targetDay,
      request.exerciseToChange,
    );
    if (exerciseIndex < 0) {
      throw new Error(
        "The exerciseToChange value does not match any exercise in the target day.",
      );
    }

    const targetExercise = targetDay.exercises[exerciseIndex];
    if (!targetExercise) {
      throw new Error("Could not resolve the target exercise.");
    }

    const normalizedProfile = request.profile
      ? this.normalizeProfile(request.profile)
      : undefined;

    const validExercises = normalizedProfile
      ? this.filterExercises(normalizedProfile)
      : this.mapToFilteredExercises(this.exercisesDb);

    const exerciseContext = JSON.stringify(validExercises);
    const changeText = request.changeRequest ?? "";

    const systemPrompt = `
    \nEres un entrenador personal experto en ciencias del deporte.
    \nTu tarea es regenerar la rutina completa, cambiando UN ejercicio concreto y manteniendo coherencia con toda la rutina.

    \n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):
    \n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios validos.
    \n2. Debes devolver SIEMPRE la rutina COMPLETA en formato {"routine":[...]}, no solo un ejercicio ni solo un dia.
    \n3. El nuevo ejercicio debe encajar con el objetivo del dia y respetar la recuperacion muscular respecto al resto de dias.
    \n4. Evita devolver exactamente el mismo ejercicio que se quiere reemplazar, salvo que sea estrictamente necesario.
    \n5. Devuelve UNICAMENTE JSON valido, sin texto adicional.

    \n\nLISTA DE EJERCICIOS VALIDOS PARA ESTE USUARIO:
    \n${exerciseContext}

    \n\nFORMATO JSON REQUERIDO:
    \n{
    \n  "routine": [
    \n    {
    \n      "day": "Día 1 - Pecho y Tríceps",
    \n      "exercises": [
    \n        {
    \n          "exerciseId": "musc_001",
    \n          "name": "Press de Banca",
    \n          "sets": 3,
    \n          "reps": "10",
    \n          "restSeconds": 90,
    \n          "note": "Controlar excéntrica"
    \n          "badges": ["Pecho", "Hombro"]
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n`;

    const modelResponse = await this.generateJsonFromModel(
      systemPrompt,
      `Rutina actual completa: ${JSON.stringify(currentRoutine)}. Dia objetivo: "${targetDay.day}". Ejercicio a reemplazar: ${JSON.stringify(targetExercise)}. Indice del ejercicio en el dia (1-based): ${exerciseIndex + 1}. Solicitud adicional del usuario: "${changeText}". Devuelve la rutina completa actualizada cambiando ese ejercicio.`,
    );

    return this.extractRoutineResponse(modelResponse);
  }
}
