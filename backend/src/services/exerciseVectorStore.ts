import crypto from "crypto";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import type { ExerciseRecord } from "@backend/types/exercise";
import {
  createGoogleAiClient,
  DEFAULT_GOOGLE_EMBEDDING_MODEL,
} from "@backend/services/googleAi";

interface CachedEmbeddingRow {
  id: string;
  signature: string;
  embedding: number[];
}

interface EmbeddingCacheFile {
  model: string;
  generatedAt: string;
  rows: CachedEmbeddingRow[];
}

export interface ScoredExercise {
  exercise: ExerciseRecord;
  score: number;
}

export interface ExerciseVectorStoreOptions {
  googleClient?: GoogleGenAI;
  model?: string;
  apiKey?: string;
  cacheFilePath?: string;
  enabled?: boolean;
}

interface VectorRow {
  exercise: ExerciseRecord;
  signature: string;
  embedding: number[];
}

export class ExerciseVectorStore {
  private readonly exercises: ExerciseRecord[];
  private readonly googleAi: GoogleGenAI;
  private readonly model: string;
  private readonly cacheFilePath: string | undefined;
  private readonly enabled: boolean;

  private readonly queryEmbeddingCache = new Map<string, number[]>();
  private vectorRows: VectorRow[] = [];
  private initializePromise?: Promise<void>;

  constructor(
    exercises: ExerciseRecord[],
    options?: ExerciseVectorStoreOptions,
  ) {
    this.exercises = exercises;
    this.enabled =
      options?.enabled ?? process.env.RAG_USE_VECTOR_SEARCH !== "false";

    this.model = options?.model ?? DEFAULT_GOOGLE_EMBEDDING_MODEL;

    const apiKey = options?.apiKey;

    this.googleAi = options?.googleClient ?? createGoogleAiClient(apiKey);

    this.cacheFilePath = options?.cacheFilePath;
  }

  public async initialize(): Promise<void> {
    if (!this.enabled) {
      this.vectorRows = [];
      return;
    }

    if (!this.initializePromise) {
      this.initializePromise = this.buildVectorRows();
    }

    await this.initializePromise;
  }

  public async search(query: string, topK: number): Promise<ScoredExercise[]> {
    if (!this.enabled) {
      return [];
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery || topK <= 0) {
      return [];
    }

    await this.initialize();
    if (this.vectorRows.length === 0) {
      return [];
    }

    const queryEmbedding = await this.getQueryEmbedding(normalizedQuery);

    const scored = this.vectorRows
      .map((row) => ({
        exercise: row.exercise,
        score: this.cosineSimilarity(queryEmbedding, row.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  private async buildVectorRows(): Promise<void> {
    const cacheById = this.readCacheById();
    const rows: VectorRow[] = [];

    for (const exercise of this.exercises) {
      const text = this.buildExerciseText(exercise);
      const signature = this.hashText(text);
      const cached = cacheById.get(exercise.id);

      if (
        cached &&
        cached.signature === signature &&
        this.isNumberArray(cached.embedding)
      ) {
        rows.push({
          exercise,
          signature,
          embedding: cached.embedding,
        });
        continue;
      }

      const embedding = await this.requestEmbedding(text, "RETRIEVAL_DOCUMENT");
      rows.push({
        exercise,
        signature,
        embedding,
      });
    }

    this.vectorRows = rows;
    this.writeCache(rows);
  }

  private buildExerciseText(exercise: ExerciseRecord): string {
    const attributes = exercise.atributos_especificos;

    const segments = [
      `id: ${exercise.id}`,
      `nombre: ${exercise.nombre}`,
      attributes?.grupo_muscular
        ? `grupo muscular: ${attributes.grupo_muscular}`
        : "",
      attributes?.tipo_mecanica ? `mecanica: ${attributes.tipo_mecanica}` : "",
      attributes?.patron_movimiento
        ? `patron: ${attributes.patron_movimiento}`
        : "",
      exercise.nivel_dificultad ? `nivel: ${exercise.nivel_dificultad}` : "",
      Array.isArray(exercise.equipamiento) && exercise.equipamiento.length > 0
        ? `equipamiento: ${exercise.equipamiento.join(", ")}`
        : "",
      Array.isArray(exercise.lesiones_prohibidas) &&
      exercise.lesiones_prohibidas.length > 0
        ? `lesiones prohibidas: ${exercise.lesiones_prohibidas.join(", ")}`
        : "",
    ].filter(Boolean);

    return segments.join(" | ");
  }

  private hashText(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
  }

  private readCacheById(): Map<string, CachedEmbeddingRow> {
    if (!this.cacheFilePath || !fs.existsSync(this.cacheFilePath)) {
      return new Map();
    }

    try {
      const raw = fs.readFileSync(this.cacheFilePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<EmbeddingCacheFile>;

      if (parsed.model !== this.model || !Array.isArray(parsed.rows)) {
        return new Map();
      }

      const rows = parsed.rows.filter(
        (row): row is CachedEmbeddingRow =>
          typeof row?.id === "string" &&
          typeof row?.signature === "string" &&
          this.isNumberArray(row?.embedding),
      );

      return new Map(rows.map((row) => [row.id, row]));
    } catch (error) {
      console.warn(
        "Failed to read embeddings cache. Recomputing vectors.",
        error,
      );
      return new Map();
    }
  }

  private writeCache(rows: VectorRow[]): void {
    if (!this.cacheFilePath) {
      return;
    }

    try {
      const payload: EmbeddingCacheFile = {
        model: this.model,
        generatedAt: new Date().toISOString(),
        rows: rows.map((row) => ({
          id: row.exercise.id,
          signature: row.signature,
          embedding: row.embedding,
        })),
      };

      fs.writeFileSync(this.cacheFilePath, JSON.stringify(payload), "utf-8");
    } catch (error) {
      console.warn("Failed to write embeddings cache.", error);
    }
  }

  private async getQueryEmbedding(query: string): Promise<number[]> {
    const cached = this.queryEmbeddingCache.get(query);
    if (cached) {
      return cached;
    }

    const embedding = await this.requestEmbedding(query, "RETRIEVAL_QUERY");
    this.queryEmbeddingCache.set(query, embedding);
    return embedding;
  }

  private async requestEmbedding(
    text: string,
    taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
  ): Promise<number[]> {
    console.log(
      `[Embedding] Iniciando petición (${taskType}) con modelo ${this.model}.`,
    );

    const response = await this.googleAi.models.embedContent({
      model: this.model,
      contents: text,
      config: {
        taskType,
      },
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!this.isNumberArray(embedding)) {
      throw new Error("Embedding response does not include a valid vector.");
    }

    return embedding;
  }

  private isNumberArray(value: unknown): value is number[] {
    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      const vector = value as unknown as ArrayLike<number>;
      return (
        vector.length > 0 &&
        Array.from(vector).every((item) => Number.isFinite(item))
      );
    }

    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => Number.isFinite(item))
    );
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const length = Math.min(a.length, b.length);
    if (length === 0) {
      return -1;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let index = 0; index < length; index += 1) {
      const aValue = a[index] ?? 0;
      const bValue = b[index] ?? 0;
      dot += aValue * bValue;
      normA += aValue * aValue;
      normB += bValue * bValue;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return -1;
    }

    return dot / denominator;
  }
}
