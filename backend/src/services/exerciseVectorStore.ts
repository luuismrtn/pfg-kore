import crypto from "crypto";
import fs from "fs";
import OpenAI from "openai";
import type { ExerciseRecord } from "@backend/types/exercise";

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
  openaiClient?: OpenAI;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  siteUrl?: string;
  appName?: string;
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
  private readonly openai: OpenAI;
  private readonly baseUrl: string;
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

    this.baseUrl = (
      options?.baseUrl ??
      process.env.OPENROUTER_BASE_URL ??
      "https://openrouter.ai/api/v1"
    ).replace(/\/+$/, "");
    this.model = options?.model ?? process.env.OPENROUTER_EMBED_MODEL ?? "";

    const apiKey = options?.apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    const hasExternalClient = Boolean(options?.openaiClient);

    this.openai =
      options?.openaiClient ??
      new OpenAI({
        baseURL: this.baseUrl,
        apiKey,
        defaultHeaders: {
          "HTTP-Referer":
            options?.siteUrl ?? process.env.OPENROUTER_SITE_URL ?? "",
          "X-OpenRouter-Title":
            options?.appName ?? process.env.OPENROUTER_APP_NAME ?? "",
        },
      });

    this.cacheFilePath = options?.cacheFilePath;

    if (this.enabled && !this.model) {
      throw new Error(
        "Missing OPENROUTER_EMBED_MODEL. Set it in backend/.env to enable vector search.",
      );
    }

    if (this.enabled && !hasExternalClient && !apiKey) {
      throw new Error(
        "Missing OPENROUTER_API_KEY. Set it in backend/.env to enable vector search.",
      );
    }
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

      const embedding = await this.requestEmbedding(text);
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

    const embedding = await this.requestEmbedding(query);
    this.queryEmbeddingCache.set(query, embedding);
    return embedding;
  }

  private async requestEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text,
      encoding_format: "float",
    });

    const embedding = this.extractEmbedding(response);
    if (!this.isNumberArray(embedding)) {
      throw new Error("Embedding response does not include a valid vector.");
    }

    return embedding;
  }

  private extractEmbedding(response: unknown): number[] | undefined {
    const candidates: unknown[] = [];

    if (response && typeof response === "object") {
      const maybeResponse = response as { data?: unknown; embedding?: unknown };
      candidates.push(maybeResponse.data, maybeResponse.embedding);
    }

    candidates.push(response);

    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length > 0) {
        const firstItem = candidate[0] as {
          embedding?: unknown;
          vector?: unknown;
        };

        if (this.isNumberArray(firstItem?.embedding)) {
          return firstItem.embedding;
        }

        if (this.isNumberArray(firstItem?.vector)) {
          return firstItem.vector;
        }

        if (this.isNumberArray(firstItem)) {
          return firstItem;
        }
      }

      if (this.isNumberArray(candidate)) {
        return candidate;
      }

      if (candidate && typeof candidate === "object") {
        const objectCandidate = candidate as {
          embeddings?: unknown;
          embedding?: unknown;
        };

        if (this.isNumberArray(objectCandidate.embedding)) {
          return objectCandidate.embedding;
        }

        if (
          Array.isArray(objectCandidate.embeddings) &&
          objectCandidate.embeddings.length > 0
        ) {
          const firstEmbedding = objectCandidate.embeddings[0] as {
            embedding?: unknown;
          };

          if (this.isNumberArray(firstEmbedding?.embedding)) {
            return firstEmbedding.embedding;
          }
        }
      }
    }

    return undefined;
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
