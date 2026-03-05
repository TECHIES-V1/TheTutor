interface CacheSetOptions {
  ex?: number;
}

interface UpstashRedisClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  del(...keys: string[]): Promise<number>;
}

class UpstashRestRedisClient implements UpstashRedisClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
  }

  private async execute<T>(command: Array<string | number>): Promise<T | null> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { result?: T; error?: string };
    if (payload.error) {
      throw new Error(payload.error);
    }

    return payload.result ?? null;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.execute<string>(["GET", key]);
    if (raw === null) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const serialized = JSON.stringify(value);
    const command: Array<string | number> = ["SET", key, serialized];

    if (options?.ex && Number.isFinite(options.ex) && options.ex > 0) {
      command.push("EX", Math.floor(options.ex));
    }

    await this.execute(command);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    const result = await this.execute<number>(["DEL", ...keys]);
    return result ?? 0;
  }
}

let redisClient: UpstashRedisClient | null | undefined;
let hasWarnedAboutRedisConfig = false;

function buildRedisClient(): UpstashRedisClient | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    if (!hasWarnedAboutRedisConfig) {
      console.warn(
        "[cache] Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable cache."
      );
      hasWarnedAboutRedisConfig = true;
    }
    return null;
  }

  return new UpstashRestRedisClient(url, token);
}

export function getUpstashRedisClient(): UpstashRedisClient | null {
  if (redisClient === undefined) {
    redisClient = buildRedisClient();
  }
  return redisClient;
}

