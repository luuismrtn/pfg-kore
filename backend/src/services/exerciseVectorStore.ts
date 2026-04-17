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

const DEFAULT_EMBEDDING_BATCH_SIZE = 24;
const DEFAULT_EMBEDDING_MAX_RETRIES = 5;
const CACHE_FLUSH_EVERY_BATCHES = 2;

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
    const pending: Array<{
      exercise: ExerciseRecord;
      signature: string;
      text: string;
    }> = [];

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

      pending.push({
        exercise,
        signature,
        text,
      });
    }

    const batchSize = this.resolveBatchSize();
    for (let offset = 0; offset < pending.length; offset += batchSize) {
      const batch = pending.slice(offset, offset + batchSize);
      const embeddings = await this.requestEmbeddings(
        batch.map((item) => item.text),
        "RETRIEVAL_DOCUMENT",
      );

      for (let index = 0; index < batch.length; index += 1) {
        const item = batch[index];
        const embedding = embeddings[index];
        if (!item || !embedding) {
          throw new Error("Embedding batch response is missing vector rows.");
        }

        rows.push({
          exercise: item.exercise,
          signature: item.signature,
          embedding,
        });
      }

      const processedBatches = Math.floor(offset / batchSize) + 1;
      const shouldFlushCache =
        processedBatches % CACHE_FLUSH_EVERY_BATCHES === 0 ||
        offset + batch.length >= pending.length;

      if (this.cacheFilePath && shouldFlushCache) {
        this.writeCache(rows);
      }
    }

    this.vectorRows = rows;
    this.writeCache(rows);
  }

  private resolveBatchSize(): number {
    const rawBatchSize = Number(process.env.EMBEDDING_BATCH_SIZE);
    if (!Number.isInteger(rawBatchSize) || rawBatchSize <= 0) {
      return DEFAULT_EMBEDDING_BATCH_SIZE;
    }

    return Math.min(rawBatchSize, 64);
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

    console.log(`[Embedding] Iniciando petición con modelo ${this.model}.`);

    const embedding = await this.requestEmbedding(query, "RETRIEVAL_QUERY");
    this.queryEmbeddingCache.set(query, embedding);
    return embedding;
  }

  private async requestEmbedding(
    text: string,
    taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
  ): Promise<number[]> {
    const embeddings = await this.requestEmbeddings([text], taskType);
    const embedding = embeddings[0];

    if (!embedding) {
      throw new Error("Embedding response does not include a valid vector.");
    }

    return embedding;
  }

  private async requestEmbeddings(
    texts: string[],
    taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
  ): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    for (
      let attempt = 0;
      attempt <= DEFAULT_EMBEDDING_MAX_RETRIES;
      attempt += 1
    ) {
      try {
        const response = await this.googleAi.models.embedContent({
          model: this.model,
          contents: texts,
          config: {
            taskType,
          },
        });

        const vectors = response.embeddings?.map((item) => item?.values) ?? [];
        if (vectors.length !== texts.length) {
          throw new Error(
            `Embedding response count mismatch (${vectors.length}/${texts.length}).`,
          );
        }

        return vectors.map((vector, index) => {
          if (!this.isNumberArray(vector)) {
            throw new Error(
              `Embedding response does not include a valid vector at position ${index}.`,
            );
          }

          return vector;
        });
      } catch (error) {
        const retryDelayMs = this.resolveRetryDelayMs(error, attempt);
        if (retryDelayMs === null) {
          throw error;
        }

        console.warn(
          `[Embedding] Quota/rate limit reached. Waiting ${Math.ceil(retryDelayMs / 1000)}s before retrying (${attempt + 1}/${DEFAULT_EMBEDDING_MAX_RETRIES + 1}).`,
        );
        await this.sleep(retryDelayMs);
      }
    }

    throw new Error("Embedding request retries exhausted.");
  }

  private resolveRetryDelayMs(error: unknown, attempt: number): number | null {
    const statusCode = this.extractStatusCode(error);
    const message = this.extractErrorMessage(error).toLowerCase();

    const isRateLimitError =
      statusCode === 429 ||
      message.includes("resource_exhausted") ||
      message.includes("quota") ||
      message.includes("rate limit");

    if (!isRateLimitError || attempt >= DEFAULT_EMBEDDING_MAX_RETRIES) {
      return null;
    }

    const parsedDelay = this.extractRetryDelayMs(error);
    const exponentialBackoffMs = Math.min(1000 * 2 ** attempt, 20000);
    const baseDelayMs = parsedDelay ?? exponentialBackoffMs;

    // Add low jitter so concurrent retries do not align.
    const jitterMs = Math.floor(Math.random() * 400);
    return Math.max(baseDelayMs + jitterMs, 1000);
  }

  private extractStatusCode(error: unknown): number | undefined {
    if (!error || typeof error !== "object") {
      return undefined;
    }

    const candidate = error as {
      status?: unknown;
      code?: unknown;
    };

    const numericStatus =
      typeof candidate.status === "number"
        ? candidate.status
        : typeof candidate.code === "number"
          ? candidate.code
          : undefined;

    if (numericStatus !== undefined) {
      return numericStatus;
    }

    const stringCode =
      typeof candidate.code === "string"
        ? candidate.code
        : typeof candidate.status === "string"
          ? candidate.status
          : undefined;

    const parsedFromString = stringCode ? Number(stringCode) : Number.NaN;
    return Number.isFinite(parsedFromString) ? parsedFromString : undefined;
  }

  private extractErrorMessage(error: unknown): string {
    if (!error) {
      return "";
    }

    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "object") {
      const candidate = error as {
        message?: unknown;
        error?: { message?: unknown };
      };

      if (typeof candidate.message === "string") {
        return candidate.message;
      }

      if (typeof candidate.error?.message === "string") {
        return candidate.error.message;
      }
    }

    return "";
  }

  private extractRetryDelayMs(error: unknown): number | undefined {
    const message = this.extractErrorMessage(error);
    const fromMessage = this.parseRetryDelayFromString(message);
    if (fromMessage !== undefined) {
      return fromMessage;
    }

    const rawJsonStart = message.indexOf("{");
    if (rawJsonStart >= 0) {
      try {
        const parsed = JSON.parse(message.slice(rawJsonStart)) as unknown;
        const fromParsed = this.findRetryDelayInObject(parsed);
        if (fromParsed !== undefined) {
          return fromParsed;
        }
      } catch {
        // Ignore JSON parse failures and continue with object traversal.
      }
    }

    return this.findRetryDelayInObject(error);
  }

  private findRetryDelayInObject(value: unknown): number | undefined {
    const visited = new Set<object>();
    const queue: unknown[] = [value];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      if (typeof current === "string") {
        const parsed = this.parseRetryDelayFromString(current);
        if (parsed !== undefined) {
          return parsed;
        }
        continue;
      }

      if (typeof current !== "object") {
        continue;
      }

      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      const record = current as Record<string, unknown>;
      const retryDelay = record.retryDelay;
      if (typeof retryDelay === "string") {
        const parsed = this.parseRetryDelayFromString(retryDelay);
        if (parsed !== undefined) {
          return parsed;
        }
      }

      const retryInfo = record.retryInfo;
      if (typeof retryInfo === "string") {
        const parsed = this.parseRetryDelayFromString(retryInfo);
        if (parsed !== undefined) {
          return parsed;
        }
      }

      for (const nested of Object.values(record)) {
        queue.push(nested);
      }
    }

    return undefined;
  }

  private parseRetryDelayFromString(value: string): number | undefined {
    const retryInMatch = value.match(/retry\s+in\s+([\d.]+)s/i);
    if (retryInMatch?.[1]) {
      const seconds = Number(retryInMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.ceil(seconds * 1000);
      }
    }

    const retryDelayMatch = value.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
    if (retryDelayMatch?.[1]) {
      const seconds = Number(retryDelayMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.ceil(seconds * 1000);
      }
    }

    const exactSecondsMatch = value.match(/^\s*([\d.]+)s\s*$/i);
    if (exactSecondsMatch?.[1]) {
      const seconds = Number(exactSecondsMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.ceil(seconds * 1000);
      }
    }

    return undefined;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
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
