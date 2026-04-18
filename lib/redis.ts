import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error("Upstash Redis の環境変数が未設定です。");
    }

    redisInstance = new Redis({
      url,
      token
    });
  }

  return redisInstance;
}

/**
 * 送信済みフラグを初回だけ作成
 * すでに存在していれば false
 */
export async function markNotificationSent(
  key: string,
  ttlSeconds: number
): Promise<boolean> {
  const redis = getRedis();

  const result = await redis.set(key, "1", {
    nx: true,
    ex: ttlSeconds
  });

  return result === "OK";
}