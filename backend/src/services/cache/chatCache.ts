import { getUpstashRedisClient } from "../../config/upstashRedis";
import { logger } from "../../config/logger";

const CACHE_PREFIX = "thetutor:chat:v1";

const ACTIVE_CONVERSATION_TTL_SECONDS = Number(
  process.env.CACHE_TTL_CHAT_ACTIVE_CONVERSATION_SECONDS ?? 45
);
const CONVERSATION_BY_ID_TTL_SECONDS = Number(
  process.env.CACHE_TTL_CHAT_CONVERSATION_BY_ID_SECONDS ?? 120
);
const CONVERSATIONS_LIST_TTL_SECONDS = Number(
  process.env.CACHE_TTL_CHAT_CONVERSATIONS_LIST_SECONDS ?? 60
);

function listKey(userId: string): string {
  return `${CACHE_PREFIX}:conversations:user:${userId}`;
}

function activeConversationKey(userId: string): string {
  return `${CACHE_PREFIX}:conversation:active:user:${userId}`;
}

function conversationByIdKey(userId: string, conversationId: string): string {
  return `${CACHE_PREFIX}:conversation:user:${userId}:id:${conversationId}`;
}

async function getJSON<T>(key: string): Promise<T | null> {
  const redis = getUpstashRedisClient();
  if (!redis) return null;

  try {
    return (await redis.get<T>(key)) ?? null;
  } catch (error) {
    logger.error({ err: error, key }, "[cache] Failed to read key");
    return null;
  }
}

async function setJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getUpstashRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    logger.error({ err: error, key }, "[cache] Failed to write key");
  }
}

async function deleteKeys(keys: string[]): Promise<void> {
  const redis = getUpstashRedisClient();
  if (!redis || keys.length === 0) return;

  try {
    await redis.del(...keys);
  } catch (error) {
    logger.error({ err: error, keys }, "[cache] Failed to delete keys");
  }
}

export async function getCachedConversationsList<T>(userId: string): Promise<T | null> {
  return getJSON<T>(listKey(userId));
}

export async function cacheConversationsList<T>(userId: string, payload: T): Promise<void> {
  await setJSON(listKey(userId), payload, CONVERSATIONS_LIST_TTL_SECONDS);
}

export async function getCachedActiveConversation<T>(userId: string): Promise<T | null> {
  return getJSON<T>(activeConversationKey(userId));
}

export async function cacheActiveConversation<T>(userId: string, payload: T): Promise<void> {
  await setJSON(activeConversationKey(userId), payload, ACTIVE_CONVERSATION_TTL_SECONDS);
}

export async function getCachedConversationById<T>(
  userId: string,
  conversationId: string
): Promise<T | null> {
  return getJSON<T>(conversationByIdKey(userId, conversationId));
}

export async function cacheConversationById<T>(
  userId: string,
  conversationId: string,
  payload: T
): Promise<void> {
  await setJSON(
    conversationByIdKey(userId, conversationId),
    payload,
    CONVERSATION_BY_ID_TTL_SECONDS
  );
}

export async function invalidateUserConversationCaches(userId: string): Promise<void> {
  await deleteKeys([listKey(userId), activeConversationKey(userId)]);
}

export async function invalidateConversationByIdCache(
  userId: string,
  conversationId: string
): Promise<void> {
  await deleteKeys([conversationByIdKey(userId, conversationId)]);
}

export async function invalidateConversationCaches(
  userId: string,
  conversationId: string
): Promise<void> {
  await deleteKeys([
    listKey(userId),
    activeConversationKey(userId),
    conversationByIdKey(userId, conversationId),
  ]);
}

