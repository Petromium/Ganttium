import Redis from "ioredis";
import { log } from "./app";

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

export function getRedisPublisher(): Redis {
  if (!publisher) {
    const host = process.env.REDIS_HOST || "localhost";
    const port = parseInt(process.env.REDIS_PORT || "6379");
    const password = process.env.REDIS_PASSWORD || undefined;

    publisher = new Redis({
      host,
      port,
      password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    publisher.on("error", (error) => {
      log(`Redis Publisher Error: ${error.message}`, "redis");
    });

    publisher.on("connect", () => {
      log("Redis Publisher connected", "redis");
    });

    publisher.on("ready", () => {
      log("Redis Publisher ready", "redis");
    });
  }

  return publisher;
}

export function getRedisSubscriber(): Redis {
  if (!subscriber) {
    const host = process.env.REDIS_HOST || "localhost";
    const port = parseInt(process.env.REDIS_PORT || "6379");
    const password = process.env.REDIS_PASSWORD || undefined;

    subscriber = new Redis({
      host,
      port,
      password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    subscriber.on("error", (error) => {
      log(`Redis Subscriber Error: ${error.message}`, "redis");
    });

    subscriber.on("connect", () => {
      log("Redis Subscriber connected", "redis");
    });

    subscriber.on("ready", () => {
      log("Redis Subscriber ready", "redis");
    });
  }

  return subscriber;
}

export async function publishToChannel(channel: string, message: any): Promise<void> {
  try {
    const pub = getRedisPublisher();
    await pub.publish(channel, JSON.stringify(message));
  } catch (error: any) {
    log(`Failed to publish to Redis channel ${channel}: ${error.message}`, "redis");
    throw error;
  }
}

export async function subscribeToChannel(
  channel: string,
  callback: (message: any) => void
): Promise<void> {
  try {
    const sub = getRedisSubscriber();
    await sub.subscribe(channel);
    sub.on("message", (ch, message) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (error) {
          log(`Failed to parse Redis message from ${channel}: ${error}`, "redis");
        }
      }
    });
  } catch (error: any) {
    log(`Failed to subscribe to Redis channel ${channel}: ${error.message}`, "redis");
    throw error;
  }
}

export async function unsubscribeFromChannel(channel: string): Promise<void> {
  try {
    const sub = getRedisSubscriber();
    await sub.unsubscribe(channel);
  } catch (error: any) {
    log(`Failed to unsubscribe from Redis channel ${channel}: ${error.message}`, "redis");
  }
}

export async function publishChatMessage(conversationId: number, message: any): Promise<void> {
  const channel = `chat:conversation:${conversationId}`;
  await publishToChannel(channel, message);
}

export async function publishTyping(conversationId: number, userId: string, isTyping: boolean): Promise<void> {
  const channel = `chat:typing:${conversationId}`;
  await publishToChannel(channel, {
    userId,
    isTyping,
    timestamp: Date.now(),
  });
}

export async function closeRedisConnections(): Promise<void> {
  if (publisher) {
    await publisher.quit();
    publisher = null;
  }
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
  log("Redis connections closed", "redis");
}
