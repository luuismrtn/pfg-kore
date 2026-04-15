import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ExerciseVectorStore } from "@backend/services/exerciseVectorStore";
import {
  createGoogleAiClient,
  DEFAULT_GOOGLE_CHAT_MODEL,
  DEFAULT_GOOGLE_CHAT_MODEL_FALLBACKS,
  DEFAULT_GOOGLE_MODEL_TIMEOUT_MS,
  DEFAULT_GOOGLE_EMBEDDING_MODEL,
  resolveUniqueModels,
} from "@backend/services/googleAi";
import type { ExerciseRecord, FilteredExercise } from "@backend/types/exercise";
import type {
  AddRoutineDayRequest,
  ChatIntentAction,
  ChatIntentRequest,
  ChatIntentResponse,
  ChangeRoutineExerciseRequest,
  ChangeRoutineDayRequest,
  RoutineDay,
  RoutineExercise,
  RoutineRequest,
  RoutineResponse,
} from "@backend/types/routine";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RagService {
  private googleAi: GoogleGenAI;
  private exercisesDb: ExerciseRecord[];
  private model: string;
  private readonly modelFallbacks: string[];
  private readonly modelRequestTimeoutMs: number;
  private vectorStore: ExerciseVectorStore;
  private semanticCandidatesLimit: number;
  private finalExercisePoolLimit: number;
  private maxSemanticCandidatesLimit: number;
  private maxFinalExercisePoolLimit: number;

  constructor() {
    this.googleAi = createGoogleAiClient();
    this.model = DEFAULT_GOOGLE_CHAT_MODEL;
    this.modelFallbacks = DEFAULT_GOOGLE_CHAT_MODEL_FALLBACKS;
    this.modelRequestTimeoutMs = DEFAULT_GOOGLE_MODEL_TIMEOUT_MS;

    const dataPath = path.join(__dirname, "../data/musculacion.json");
    try {
      const fileData = fs.readFileSync(dataPath, "utf-8");
      this.exercisesDb = JSON.parse(fileData);
    } catch (error) {
      console.error("Error loading exercise dataset:", error);
      this.exercisesDb = [];
    }

    this.semanticCandidatesLimit = this.parsePositiveInteger(
      process.env.RAG_SEMANTIC_TOP_K,
      20,
    );
    this.finalExercisePoolLimit = this.parsePositiveInteger(
      process.env.RAG_FINAL_EXERCISE_POOL_SIZE,
      10,
    );
    this.maxSemanticCandidatesLimit = this.parsePositiveInteger(
      process.env.RAG_MAX_SEMANTIC_TOP_K,
      120,
    );
    this.maxFinalExercisePoolLimit = this.parsePositiveInteger(
      process.env.RAG_MAX_FINAL_EXERCISE_POOL_SIZE,
      48,
    );

    const vectorStoreOptions = {
      googleClient: this.googleAi,
      cacheFilePath: path.join(
        __dirname,
        "../data/musculacion.embeddings.cache.json",
      ),
      ...(DEFAULT_GOOGLE_EMBEDDING_MODEL
        ? { DEFAULT_GOOGLE_EMBEDDING_MODEL }
        : {}),
    };

    this.vectorStore = new ExerciseVectorStore(
      this.exercisesDb,
      vectorStoreOptions,
    );

    void this.vectorStore.initialize().catch((error) => {
      console.warn(
        "Could not prebuild exercise vector index. The service will fallback to classic filtering.",
        error,
      );
    });
  }

  private parsePositiveInteger(rawValue: string | undefined, fallback: number) {
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
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

  private filterExerciseRecords(
    request: RoutineRequest,
    sourceExercises: ExerciseRecord[] = this.exercisesDb,
  ): ExerciseRecord[] {
    const levelFiltered = this.filterByLevel(sourceExercises, request.level);
    const injuryFiltered = this.filterByInjuries(
      levelFiltered,
      request.injuries,
    );
    return this.filterByEquipment(
      injuryFiltered,
      request.equipment,
      request.weightKg as number,
    );
  }

  private filterExercises(
    request: RoutineRequest,
    sourceExercises: ExerciseRecord[] = this.exercisesDb,
  ): FilteredExercise[] {
    const validExercises = this.filterExerciseRecords(request, sourceExercises);

    return validExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.nombre,
      modalidad: exercise.modalidad ?? "Sin especificar",
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
      modalidad: exercise.modalidad ?? "Sin especificar",
      muscleGroup:
        exercise.atributos_especificos?.grupo_muscular || "Sin especificar",
      mechanicType:
        exercise.atributos_especificos?.tipo_mecanica || "Sin especificar",
      movementPattern:
        exercise.atributos_especificos?.patron_movimiento || "Sin especificar",
    }));
  }

  private dedupeExercises(exercises: ExerciseRecord[]): ExerciseRecord[] {
    const used = new Set<string>();
    const deduped: ExerciseRecord[] = [];

    for (const exercise of exercises) {
      if (used.has(exercise.id)) {
        continue;
      }

      used.add(exercise.id);
      deduped.push(exercise);
    }

    return deduped;
  }

  private mergeExercisePools(
    primaryPool: ExerciseRecord[],
    fallbackPool: ExerciseRecord[],
    limit: number,
  ): ExerciseRecord[] {
    const merged = this.dedupeExercises([...primaryPool, ...fallbackPool]);
    return merged.slice(0, limit);
  }

  private buildSemanticQuery(
    profile: Partial<RoutineRequest> | undefined,
    userText: string,
    operationContext: string,
  ): string {
    const segments = [
      userText,
      operationContext,
      profile?.sport ? `deporte: ${profile.sport}` : "",
      profile?.level ? `nivel: ${profile.level}` : "",
      typeof profile?.age === "number" ? `edad: ${profile.age} anos` : "",
      profile?.gender ? `genero: ${profile.gender}` : "",
      profile?.availableDays
        ? `dias de entrenamiento: ${profile.availableDays}`
        : "",
      profile?.averageDurationMinutes
        ? `duracion aproximada por dia: ${profile.averageDurationMinutes} minutos`
        : "",
      Array.isArray(profile?.equipment) && profile.equipment.length > 0
        ? `equipamiento disponible: ${profile.equipment.join(", ")}`
        : "",
      Array.isArray(profile?.injuries) && profile.injuries.length > 0
        ? `lesiones o molestias: ${profile.injuries.join(", ")}`
        : "",
    ].filter(Boolean);

    if (segments.length === 0) {
      return "rutina de entrenamiento equilibrada";
    }

    return segments.join(". ");
  }

  private estimateExercisesPerDay(averageDurationMinutes: number): number {
    if (averageDurationMinutes <= 40) {
      return 4;
    }

    if (averageDurationMinutes <= 55) {
      return 5;
    }

    if (averageDurationMinutes <= 75) {
      return 6;
    }

    if (averageDurationMinutes <= 95) {
      return 7;
    }

    return 8;
  }

  private resolveTargetExercisePoolSize(profile?: RoutineRequest): number {
    if (!profile) {
      return this.finalExercisePoolLimit;
    }

    const days = Math.max(1, Number(profile.availableDays) || 1);
    const minutes = Math.max(20, Number(profile.averageDurationMinutes) || 60);
    const exercisesPerDay = this.estimateExercisesPerDay(minutes);
    const volumeTarget = days * exercisesPerDay;
    const safetyBuffer = Math.max(2, Math.ceil(days * 1.5));
    const requestedPool = volumeTarget + safetyBuffer;

    const boundedPool = Math.min(
      Math.max(this.finalExercisePoolLimit, requestedPool),
      this.maxFinalExercisePoolLimit,
    );

    return boundedPool;
  }

  private resolveSemanticTopK(targetPoolSize: number): number {
    const requested = Math.max(
      this.semanticCandidatesLimit,
      targetPoolSize * 3,
    );
    const bounded = Math.min(requested, this.maxSemanticCandidatesLimit);
    return Math.min(bounded, this.exercisesDb.length);
  }

  private async retrieveSemanticCandidates(
    semanticQuery: string,
    topK: number,
  ): Promise<ExerciseRecord[]> {
    const normalizedQuery = semanticQuery.trim();
    if (!normalizedQuery) {
      return this.exercisesDb.slice(0, topK);
    }

    try {
      const results = await this.vectorStore.search(normalizedQuery, topK);

      if (results.length === 0) {
        return this.exercisesDb.slice(0, topK);
      }

      return results.map((result) => result.exercise);
    } catch (error) {
      console.warn(
        "Vector search unavailable. Falling back to classic pool selection.",
        error,
      );
      return this.exercisesDb.slice(0, topK);
    }
  }

  private async buildPromptExercisePool(options: {
    profile?: RoutineRequest | undefined;
    semanticQuery: string;
  }): Promise<FilteredExercise[]> {
    const targetPoolSize = this.resolveTargetExercisePoolSize(options.profile);
    const semanticTopK = this.resolveSemanticTopK(targetPoolSize);

    const semanticCandidates = await this.retrieveSemanticCandidates(
      options.semanticQuery,
      semanticTopK,
    );

    if (!options.profile) {
      const rawPool = this.mergeExercisePools(
        semanticCandidates,
        this.exercisesDb,
        targetPoolSize,
      );
      return this.mapToFilteredExercises(rawPool);
    }

    const hardFilteredOnSemantic = this.filterExerciseRecords(
      options.profile,
      semanticCandidates,
    );
    const hardFilteredFullDb = this.filterExerciseRecords(options.profile);

    const mergedPool = this.mergeExercisePools(
      hardFilteredOnSemantic,
      hardFilteredFullDb,
      targetPoolSize,
    );

    if (mergedPool.length < targetPoolSize) {
      console.warn(
        `Limited exercise pool after hard filters (${mergedPool.length}/${targetPoolSize}). Consider expanding dataset coverage for this profile.`,
      );
    }

    return this.mapToFilteredExercises(mergedPool);
  }

  private async generateJsonFromModel(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<Record<string, unknown>> {
    console.log("SystemPrompt: ", systemPrompt);
    console.log("userPrompt: ", userPrompt);

    const modelsToTry = resolveUniqueModels(this.model, this.modelFallbacks);

    let lastError: unknown;

    for (const model of modelsToTry) {
      try {
        return await this.generateJsonWithModel(
          model,
          systemPrompt,
          userPrompt,
          true,
        );
      } catch (error) {
        lastError = error;
        const details = this.getModelErrorDetails(error);
        console.warn(
          `Google AI model attempt failed (${model}): ${details.code ?? "unknown"} - ${details.message ?? "unknown"}`,
        );

        if (this.shouldRetryWithoutResponseFormat(details.message)) {
          try {
            return await this.generateJsonWithModel(
              model,
              systemPrompt,
              userPrompt,
              false,
            );
          } catch (retryError) {
            lastError = retryError;
            const retryDetails = this.getModelErrorDetails(retryError);
            console.warn(
              `Google AI retry without JSON mode failed (${model}): ${retryDetails.code ?? "unknown"} - ${retryDetails.message ?? "unknown"}`,
            );
          }
        }
      }
    }

    const finalDetails = this.getModelErrorDetails(lastError);
    console.error(
      `Error during AI generation after fallback attempts: ${finalDetails.code ?? "unknown"} - ${finalDetails.message ?? "unknown"}`,
    );

    throw new Error("Failed to generate routine with AI.");
  }

  private async generateJsonWithModel(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    useJsonMode: boolean,
  ): Promise<Record<string, unknown>> {
    console.log(
      `Connecting to Google AI with model: ${model}${useJsonMode ? "" : " (fallback without responseMimeType)"}`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.modelRequestTimeoutMs,
    );

    try {
      const response = await this.googleAi.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          ...(useJsonMode ? { responseMimeType: "application/json" } : {}),
          abortSignal: controller.signal,
        },
      });

      const modelOutput = this.extractModelOutput(response);
      if (!modelOutput) {
        throw new Error("Empty response from AI model.");
      }

      return this.parseJsonOutput(modelOutput);
    } finally {
      clearTimeout(timeoutId);
      console.log("Finished AI generation attempt.");
    }
  }

  private extractModelOutput(response: unknown): string | undefined {
    if (!response || typeof response !== "object") {
      return undefined;
    }

    const candidateResponse = response as {
      text?: unknown;
      choices?: Array<{
        message?: {
          content?: unknown;
        };
      }>;
    };

    if (typeof candidateResponse.text === "string") {
      return candidateResponse.text;
    }

    const content = candidateResponse.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }

          if (part && typeof part === "object" && "text" in part) {
            return String((part as { text?: unknown }).text ?? "");
          }

          return "";
        })
        .join("");
    }

    return undefined;
  }

  private parseJsonOutput(content: string): Record<string, unknown> {
    const trimmed = content.trim();

    const direct = this.tryParseJson(trimmed);
    if (direct) {
      return direct;
    }

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      const fencedJson = this.tryParseJson(fencedMatch[1].trim());
      if (fencedJson) {
        return fencedJson;
      }
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const slicedJson = this.tryParseJson(
        trimmed.slice(firstBrace, lastBrace + 1),
      );
      if (slicedJson) {
        return slicedJson;
      }
    }

    throw new Error("Model response is not valid JSON.");
  }

  private tryParseJson(value: string): Record<string, unknown> | undefined {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }

  private getModelErrorDetails(error: unknown): {
    code?: string | number;
    message?: string;
  } {
    const candidateError = error as {
      code?: string | number;
      status?: number;
      message?: string;
      error?: { message?: string };
    };

    const details: { code?: string | number; message?: string } = {};

    if (candidateError?.code !== undefined) {
      details.code = candidateError.code;
    } else if (candidateError?.status !== undefined) {
      details.code = candidateError.status;
    }

    const message = candidateError?.message ?? candidateError?.error?.message;
    if (message !== undefined) {
      details.message = message;
    }

    return details;
  }

  private shouldRetryWithoutResponseFormat(message?: string): boolean {
    const normalizedMessage = (message ?? "").toLowerCase();

    return (
      normalizedMessage.includes("response_format") ||
      normalizedMessage.includes("responsemimetype") ||
      normalizedMessage.includes("application/json") ||
      normalizedMessage.includes("json_object") ||
      normalizedMessage.includes("structured output") ||
      normalizedMessage.includes("structured_outputs")
    );
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
      age: typeof profile?.age === "number" ? profile.age : "",
      gender: profile?.gender ?? "prefiero no decirlo",
      sport: profile?.sport ?? "",
      availableDays: Number(profile?.availableDays) || 3,
      averageDurationMinutes: Number(profile?.averageDurationMinutes) || 60,
      equipment: Array.isArray(profile?.equipment) ? profile.equipment : [],
      injuries: Array.isArray(profile?.injuries) ? profile.injuries : [],
      level: profile?.level ?? "Principiante",
    };
  }

  private resolveChatIntentAction(rawAction: unknown): ChatIntentAction {
    if (typeof rawAction !== "string") {
      return "question";
    }

    const normalizedAction = this.normalizeText(rawAction).replace(/\s+/g, "_");

    if (
      ["create_routine", "crear_rutina", "generate_routine"].includes(
        normalizedAction,
      )
    ) {
      return "create_routine";
    }

    if (["change_exercise", "cambiar_ejercicio"].includes(normalizedAction)) {
      return "change_exercise";
    }

    if (
      ["change_day", "cambiar_dia", "cambiar_dia_completo"].includes(
        normalizedAction,
      )
    ) {
      return "change_day";
    }

    if (["add_day", "anadir_dia", "agregar_dia"].includes(normalizedAction)) {
      return "add_day";
    }

    return "question";
  }

  private pickOptionalText(value: unknown): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private getDefaultChatResponse(action: ChatIntentAction): string {
    if (action === "create_routine") {
      return "Perfecto, voy a crear tu rutina desde cero.";
    }

    if (action === "change_exercise") {
      return "He entendido que quieres cambiar un ejercicio concreto.";
    }

    if (action === "change_day") {
      return "He entendido que quieres cambiar un día completo de tu rutina.";
    }

    if (action === "add_day") {
      return "He entendido que quieres añadir un día más a tu rutina.";
    }

    return "Te ayudo con tu duda. Si quieres modificar tu rutina, dímelo en detalle.";
  }

  private extractRoutineResponse(
    modelResponse: Record<string, unknown>,
  ): RoutineResponse {
    const routine = modelResponse.routine;
    if (!Array.isArray(routine)) {
      throw new Error("AI response does not contain a valid routine array.");
    }

    const normalizedRoutine = routine.map((day) => this.toRoutineDay(day));
    if (normalizedRoutine.some((day) => day === null)) {
      throw new Error("AI response contains an invalid routine day.");
    }

    return {
      routine: normalizedRoutine as RoutineResponse["routine"],
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private toRoutineExercise(value: unknown): RoutineExercise | null {
    if (!this.isRecord(value)) {
      return null;
    }

    const exerciseId =
      typeof value.exerciseId === "string" ? value.exerciseId.trim() : "";
    const name = typeof value.name === "string" ? value.name.trim() : "";
    const sets = Number(value.sets);
    const repsValue = value.reps;
    const reps =
      typeof repsValue === "string"
        ? repsValue.trim()
        : typeof repsValue === "number" && Number.isFinite(repsValue)
          ? String(repsValue)
          : "";
    const restSeconds = Number(value.restSeconds);
    const intensity = Number(value.intensity);

    if (
      !exerciseId ||
      !name ||
      !Number.isFinite(sets) ||
      sets <= 0 ||
      !reps ||
      !Number.isFinite(restSeconds) ||
      restSeconds < 0 ||
      !Number.isInteger(intensity) ||
      intensity < 1 ||
      intensity > 10
    ) {
      return null;
    }

    const exercise: RoutineExercise = {
      exerciseId,
      name,
      sets,
      reps,
      restSeconds,
      intensity,
    };

    const note = typeof value.note === "string" ? value.note.trim() : "";
    if (note.length > 0) {
      exercise.note = note;
    }

    if (Array.isArray(value.badges)) {
      const badges = value.badges
        .filter((badge): badge is string => typeof badge === "string")
        .map((badge) => badge.trim())
        .filter((badge) => badge.length > 0);

      if (badges.length > 0) {
        exercise.badges = badges;
      }
    }

    return exercise;
  }

  private toRoutineDay(value: unknown): RoutineDay | null {
    if (!this.isRecord(value)) {
      return null;
    }

    const day = typeof value.day === "string" ? value.day.trim() : "";
    if (!day || !Array.isArray(value.exercises)) {
      return null;
    }

    const exercises = value.exercises.map((exercise) =>
      this.toRoutineExercise(exercise),
    );

    if (exercises.some((exercise) => exercise === null)) {
      return null;
    }

    return {
      day,
      exercises: exercises as RoutineExercise[],
    };
  }

  private tryExtractRoutineResponse(
    modelResponse: Record<string, unknown>,
  ): RoutineResponse | null {
    const routine = modelResponse.routine;
    if (!Array.isArray(routine)) {
      return null;
    }

    const normalizedRoutine = routine.map((day) => this.toRoutineDay(day));
    if (normalizedRoutine.some((day) => day === null)) {
      return null;
    }

    return {
      routine: normalizedRoutine as RoutineResponse["routine"],
    };
  }

  private tryExtractDayFragment(
    modelResponse: Record<string, unknown>,
  ): RoutineDay | null {
    const directDay = this.toRoutineDay(modelResponse);
    if (directDay) {
      return directDay;
    }

    const routine = modelResponse.routine;
    if (Array.isArray(routine) && routine.length === 1) {
      return this.toRoutineDay(routine[0]);
    }

    return null;
  }

  private tryExtractExerciseFragment(
    modelResponse: Record<string, unknown>,
  ): RoutineExercise | null {
    const directExercise = this.toRoutineExercise(modelResponse);
    if (directExercise) {
      return directExercise;
    }

    if (this.isRecord(modelResponse) && "exercise" in modelResponse) {
      const nestedExercise = this.toRoutineExercise(modelResponse.exercise);
      if (nestedExercise) {
        return nestedExercise;
      }
    }

    if (
      this.isRecord(modelResponse) &&
      Array.isArray(modelResponse.exercises) &&
      modelResponse.exercises.length === 1
    ) {
      return this.toRoutineExercise(modelResponse.exercises[0]);
    }

    const routine = modelResponse.routine;
    if (Array.isArray(routine) && routine.length === 1) {
      const singleDay = this.toRoutineDay(routine[0]);
      if (singleDay?.exercises.length === 1) {
        return singleDay.exercises[0] ?? null;
      }
    }

    return null;
  }

  private replaceRoutineDay(
    currentRoutine: RoutineResponse,
    dayIndex: number,
    nextDay: RoutineDay,
  ): RoutineResponse {
    return {
      routine: currentRoutine.routine.map((day, index) =>
        index === dayIndex ? nextDay : day,
      ),
    };
  }

  private replaceRoutineExercise(
    currentRoutine: RoutineResponse,
    dayIndex: number,
    exerciseIndex: number,
    nextExercise: RoutineExercise,
  ): RoutineResponse {
    return {
      routine: currentRoutine.routine.map((day, index) => {
        if (index !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, currentIndex) =>
            currentIndex === exerciseIndex ? nextExercise : exercise,
          ),
        };
      }),
    };
  }

  private appendRoutineDay(
    currentRoutine: RoutineResponse,
    nextDay: RoutineDay,
  ): RoutineResponse {
    return {
      routine: [...currentRoutine.routine, nextDay],
    };
  }

  private buildDayUpdatedRoutine(
    currentRoutine: RoutineResponse,
    dayIndex: number,
    modelResponse: Record<string, unknown>,
  ): RoutineResponse {
    const fullRoutine = this.tryExtractRoutineResponse(modelResponse);
    if (fullRoutine?.routine.length === currentRoutine.routine.length) {
      return fullRoutine;
    }

    const dayFragment = this.tryExtractDayFragment(modelResponse);
    if (dayFragment) {
      return this.replaceRoutineDay(currentRoutine, dayIndex, dayFragment);
    }

    throw new Error("AI response does not contain a valid day update.");
  }

  private buildExerciseUpdatedRoutine(
    currentRoutine: RoutineResponse,
    dayIndex: number,
    exerciseIndex: number,
    modelResponse: Record<string, unknown>,
  ): RoutineResponse {
    const fullRoutine = this.tryExtractRoutineResponse(modelResponse);
    if (fullRoutine?.routine.length === currentRoutine.routine.length) {
      return fullRoutine;
    }

    const dayFragment = this.tryExtractDayFragment(modelResponse);
    if (dayFragment) {
      return this.replaceRoutineDay(currentRoutine, dayIndex, dayFragment);
    }

    const exerciseFragment = this.tryExtractExerciseFragment(modelResponse);
    if (exerciseFragment) {
      return this.replaceRoutineExercise(
        currentRoutine,
        dayIndex,
        exerciseIndex,
        exerciseFragment,
      );
    }

    throw new Error("AI response does not contain a valid exercise update.");
  }

  private buildAddedDayRoutine(
    currentRoutine: RoutineResponse,
    modelResponse: Record<string, unknown>,
  ): RoutineResponse {
    const fullRoutine = this.tryExtractRoutineResponse(modelResponse);
    if (fullRoutine?.routine.length === currentRoutine.routine.length + 1) {
      return fullRoutine;
    }

    const dayFragment = this.tryExtractDayFragment(modelResponse);
    if (dayFragment) {
      return this.appendRoutineDay(currentRoutine, dayFragment);
    }

    throw new Error("AI response does not contain a valid added day.");
  }

  public async interpretChatIntent(
    request: ChatIntentRequest,
  ): Promise<ChatIntentResponse> {
    const normalizedText = request?.text?.trim();
    if (!normalizedText) {
      throw new Error("Missing chat text to interpret.");
    }

    const normalizedProfile = request.profile
      ? this.normalizeProfile(request.profile)
      : undefined;

    const routineContext = request.routine
      ? JSON.stringify(request.routine)
      : "No hay una rutina cargada actualmente.";
    const profileContext = normalizedProfile
      ? JSON.stringify(normalizedProfile)
      : "No hay perfil del usuario disponible.";

    const systemPrompt = `
    \nEres un asistente de fitness que clasifica la intención del usuario y responde SOLO en JSON válido.
    \nDebes devolver SIEMPRE este formato:
    \n{
    \n  "action": "create_routine|change_exercise|change_day|add_day|question",
    \n  "dayToChange": "string opcional",
    \n  "exerciseToChange": "string opcional",
    \n  "responseText": "respuesta corta en español"
    \n}

    \nReglas:
    \n1. create_routine: si pide crear/generar rutina completa desde cero.
    \n2. change_exercise: si pide cambiar un ejercicio concreto de un día.
    \n3. change_day: si pide cambiar/rehacer un día completo.
    \n4. add_day: si pide añadir un día adicional a la rutina actual.
    \n5. question: si solo es duda o consulta sin pedir cambios estructurales de la rutina.
    \n6. Si action es question, responseText debe contestar directamente la duda del usuario en español y personalizarse con el perfil cuando esté disponible (edad, género, nivel, lesiones y equipamiento).
    \n7. Si action NO es question, responseText debe ser una confirmación breve de la acción detectada.
    \n8. dayToChange y exerciseToChange deben ir vacíos si no aplican.
    \n9. Si el usuario habla de "día 2" o "ejercicio 3", devuelve esos valores como texto ("2", "3").
    \n`;

    const modelResponse = await this.generateJsonFromModel(
      systemPrompt,
      `Mensaje del usuario: "${normalizedText}". Perfil del usuario para contexto: ${profileContext}. Rutina actual disponible para contexto: ${routineContext}`,
    );

    const action = this.resolveChatIntentAction(modelResponse.action);
    const dayToChange = this.pickOptionalText(modelResponse.dayToChange);
    const exerciseToChange = this.pickOptionalText(
      modelResponse.exerciseToChange,
    );
    const responseText =
      this.pickOptionalText(modelResponse.responseText) ??
      this.getDefaultChatResponse(action);

    const intentResponse: ChatIntentResponse = {
      action,
      responseText,
    };

    if (dayToChange) {
      intentResponse.dayToChange = dayToChange;
    }

    if (exerciseToChange) {
      intentResponse.exerciseToChange = exerciseToChange;
    }

    return intentResponse;
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
      age: typeof request?.age === "number" ? request.age : "",
      gender: request?.gender ?? "prefiero no decirlo",
      sport: request?.sport ?? "",
      availableDays: Number(request?.availableDays) || 3,
      averageDurationMinutes: Number(request?.averageDurationMinutes) || 60,
      equipment: Array.isArray(request?.equipment) ? request.equipment : [],
      injuries: Array.isArray(request?.injuries) ? request.injuries : [],
      level: request?.level ?? "Principiante",
    };

    const semanticQuery = this.buildSemanticQuery(
      normalizedRequest,
      normalizedRequest.text,
      `crea una rutina de ${normalizedRequest.sport}`,
    );

    const validExercises = await this.buildPromptExercisePool({
      profile: normalizedRequest,
      semanticQuery,
    });
    const exerciseContext = JSON.stringify(validExercises);

    console.log(
      "Valid exercises for this user after semantic retrieval + hard filters:",
      validExercises,
    );

    const systemPrompt = `
    \nEres un entrenador personal experto en ciencias del deporte.
    \nTu tarea es crear una rutina de ejercicios estructurada en formato JSON estricto.
    
    \n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):
    \n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios válidos.
    \n   Si inventas un ejercicio o usas uno fuera de esta lista, el sistema fallará.
    \n2. La rutina debe ser de ${normalizedRequest.availableDays} días. El objetivo es cubrir todo el cuerpo de manera equilibrada, pero puedes enfocarte más en las preferencias del usuario si las hay. Cada día debe tener un enfoque claro (ej. "Día 1 - Pecho y Tríceps").
    \n3. Devuelve ÚNICAMENTE código JSON válido, sin texto adicional antes o después.
    \n4. El tiempo medio de entrenamiento por día debe ser de aproximadamente ${normalizedRequest.averageDurationMinutes} minutos. Ajusta el número de ejercicios, series y repeticiones (si puede ser un número exacto de repeticiones mejor o también es válido poner como repeticiones "FALLO" para que el usuario haga el máximo de repeticiones) para cumplir con este tiempo.
    \n5. Es obligatorio que pongas por lo menos 1 badge de grupo muscular en cada ejercicio, para facilitar la navegación en la app.
    \n6. Personaliza la rutina considerando los datos del perfil (edad, género, peso, altura, nivel y lesiones) sin romper las reglas anteriores.
    \n7. Cada ejercicio DEBE incluir el campo "intensity" en escala entera del 1 al 10, donde 10 es fallo y 1 es esfuerzo muy bajo.
    
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
    \n          "intensity": 8,
    \n          "note": "Controlar excéntrica",
    \n          "badges": ["Pecho", "Hombro"]
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n`;

    const response = await this.generateJsonFromModel(
      systemPrompt,
      `Perfil del usuario: ${JSON.stringify(normalizedRequest)}. Solicitud adicional del usuario: "${normalizedRequest.text}".`,
    );

    return this.extractRoutineResponse(response);
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

    const targetDay = currentRoutine.routine[dayIndex];
    if (!targetDay) {
      throw new Error("Could not resolve the target day to replace.");
    }

    const normalizedProfile = request.profile
      ? this.normalizeProfile(request.profile)
      : undefined;

    const changeText = request.changeRequest ?? "";
    const semanticQuery = this.buildSemanticQuery(
      normalizedProfile,
      changeText,
      `regenerar ${targetDay.day} manteniendo coherencia con ${targetDay.exercises.map((exercise) => exercise.name).join(", ")}`,
    );

    const validExercises = await this.buildPromptExercisePool({
      profile: normalizedProfile,
      semanticQuery,
    });

    const exerciseContext = JSON.stringify(validExercises);

    const systemPrompt = `
    \nEres un entrenador personal experto en ciencias del deporte.
    \nTu tarea es regenerar la rutina completa, cambiando el dia objetivo y manteniendo coherencia con el resto de dias.

    \n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):
    \n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios validos.
    \n2. NO repitas exactamente el mismo contenido del dia que se reemplaza, salvo que sea estrictamente necesario.
    \n3. Debes respetar la logica de recuperacion muscular frente al resto de dias ya existentes.
    \n4. Debes devolver SIEMPRE la rutina COMPLETA en formato {"routine":[...]}, no solo un dia.
    \n5. Devuelve UNICAMENTE JSON valido, sin texto adicional.
    \n6. Cada ejercicio DEBE incluir el campo "intensity" en escala entera del 1 al 10, donde 10 fallo y 1 es esfuerzo muy bajo.

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
    \n          "intensity": 8,
    \n          "note": "Controlar excéntrica",
    \n          "badges": ["Pecho", "Hombro"]
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n`;

    const modelResponse = await this.generateJsonFromModel(
      systemPrompt,
      `Perfil del usuario: ${normalizedProfile ? JSON.stringify(normalizedProfile) : "No disponible"}. Rutina actual completa: ${JSON.stringify(currentRoutine)}. Dia a reemplazar: "${targetDay.day}". Indice del dia (1-based): ${dayIndex + 1}. Solicitud adicional del usuario: "${changeText}". Devuelve la rutina completa actualizada cambiando ese dia.`,
    );

    return this.buildDayUpdatedRoutine(currentRoutine, dayIndex, modelResponse);
  }

  public async addRoutineDay(
    request: AddRoutineDayRequest,
  ): Promise<RoutineResponse> {
    const currentRoutine = request.routine;

    if (
      !Array.isArray(currentRoutine?.routine) ||
      currentRoutine.routine.length === 0
    ) {
      throw new Error("A current routine is required to add a new day.");
    }

    const normalizedProfile = request.profile
      ? this.normalizeProfile(request.profile)
      : undefined;
    const changeText = request.changeRequest ?? "";
    const semanticQuery = this.buildSemanticQuery(
      normalizedProfile,
      changeText,
      `anadir un nuevo dia coherente con los dias actuales: ${currentRoutine.routine
        .map((day) => day.day)
        .join(", ")}`,
    );

    const validExercises = await this.buildPromptExercisePool({
      profile: normalizedProfile,
      semanticQuery,
    });

    const exerciseContext = JSON.stringify(validExercises);

    const systemPrompt = `
    \nEres un entrenador personal experto en ciencias del deporte.
    \nTu tarea es regenerar la rutina completa añadiendo EXACTAMENTE un día nuevo adicional.

    \n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):
    \n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios válidos.
    \n2. Debes devolver SIEMPRE la rutina COMPLETA en formato {"routine":[...]}.
    \n3. Debe mantenerse la coherencia de recuperación muscular entre todos los días.
    \n4. La rutina resultante debe tener exactamente un día más que la rutina original.
    \n5. Devuelve UNICAMENTE JSON válido, sin texto adicional.
    \n6. Cada ejercicio DEBE incluir el campo "intensity" en escala entera del 1 al 10, donde 10 fallo y 1 es esfuerzo muy bajo.

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
    \n          "intensity": 8,
    \n          "note": "Controlar excéntrica",
    \n          "badges": ["Pecho", "Hombro"]
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n`;

    const modelResponse = await this.generateJsonFromModel(
      systemPrompt,
      `Perfil del usuario: ${normalizedProfile ? JSON.stringify(normalizedProfile) : "No disponible"}. Rutina actual completa: ${JSON.stringify(currentRoutine)}. Solicitud adicional del usuario: "${changeText}". Devuelve la rutina completa actualizada con exactamente un día nuevo añadido.`,
    );

    const updatedRoutine = this.buildAddedDayRoutine(
      currentRoutine,
      modelResponse,
    );
    if (updatedRoutine.routine.length !== currentRoutine.routine.length + 1) {
      throw new Error(
        "The AI response must contain exactly one additional day.",
      );
    }

    return updatedRoutine;
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
    const changeText = request.changeRequest ?? "";
    const semanticQuery = this.buildSemanticQuery(
      normalizedProfile,
      changeText,
      `reemplazar ${targetExercise.name} dentro de ${targetDay.day} con un ejercicio equivalente`,
    );

    const validExercises = await this.buildPromptExercisePool({
      profile: normalizedProfile,
      semanticQuery,
    });

    const exerciseContext = JSON.stringify(validExercises);

    const systemPrompt = `
    \nEres un entrenador personal experto en ciencias del deporte.
    \nTu tarea es regenerar la rutina completa, cambiando UN ejercicio concreto y manteniendo coherencia con toda la rutina.

    \n\nREGLAS ESTRICTAS (HARD CONSTRAINTS):
    \n1. SOLO PUEDES ELEGIR ejercicios de la siguiente lista de ejercicios validos.
    \n2. Debes devolver SIEMPRE la rutina COMPLETA en formato {"routine":[...]}, no solo un ejercicio ni solo un dia.
    \n3. El nuevo ejercicio debe encajar con el objetivo del dia y respetar la recuperacion muscular respecto al resto de dias.
    \n4. Evita devolver exactamente el mismo ejercicio que se quiere reemplazar, salvo que sea estrictamente necesario.
    \n5. Devuelve UNICAMENTE JSON valido, sin texto adicional.
    \n6. Cada ejercicio DEBE incluir el campo "intensity" en escala entera del 1 al 10, donde 10 es fallo y 1 es esfuerzo muy bajo.

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
    \n          "intensity": 8,
    \n          "note": "Controlar excéntrica",
    \n          "badges": ["Pecho", "Hombro"]
    \n        }
    \n      ]
    \n    }
    \n  ]
    \n}
    \n`;

    const modelResponse = await this.generateJsonFromModel(
      systemPrompt,
      `Perfil del usuario: ${normalizedProfile ? JSON.stringify(normalizedProfile) : "No disponible"}. Rutina actual completa: ${JSON.stringify(currentRoutine)}. Dia objetivo: "${targetDay.day}". Ejercicio a reemplazar: ${JSON.stringify(targetExercise)}. Indice del ejercicio en el dia (1-based): ${exerciseIndex + 1}. Solicitud adicional del usuario: "${changeText}". Devuelve la rutina completa actualizada cambiando ese ejercicio.`,
    );

    return this.buildExerciseUpdatedRoutine(
      currentRoutine,
      dayIndex,
      exerciseIndex,
      modelResponse,
    );
  }
}
