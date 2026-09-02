// frontend/lib/dataCache.ts
// In-memory cache layer with TTL, stale-while-revalidate, and event invalidation

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
  promise?: Promise<T>;
};

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  /**
   * Get cached data if available and fresh.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) return null;
    return entry.data as T;
  }

  /**
   * Get cached data even if stale (for instant UI render).
   */
  getStale<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? (entry.data as T) : null;
  }

  /**
   * Set cache entry with data and optional TTL (default 30 seconds).
   */
  set<T>(key: string, data: T, ttlMs = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
    this.notify(key, data);
  }

  /**
   * Fetch with in-memory caching and request deduplication.
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = 30000,
    forceRefresh = false
  ): Promise<T> {
    const entry = this.cache.get(key);

    // If forceRefresh is false and we have fresh cached data, return immediately
    if (!forceRefresh && entry) {
      const isFresh = Date.now() - entry.timestamp <= entry.ttl;
      if (isFresh) {
        return entry.data as T;
      }
    }

    // Deduplicate in-flight requests
    if (entry?.promise) {
      return entry.promise as Promise<T>;
    }

    const promise = (async () => {
      try {
        const freshData = await fetcher();
        this.cache.set(key, {
          data: freshData,
          timestamp: Date.now(),
          ttl: ttlMs,
        });
        this.notify(key, freshData);
        return freshData;
      } finally {
        const current = this.cache.get(key);
        if (current) {
          delete current.promise;
        }
      }
    })();

    if (entry) {
      entry.promise = promise;
    } else {
      this.cache.set(key, {
        data: null as any,
        timestamp: 0,
        ttl: ttlMs,
        promise,
      });
    }

    return promise;
  }

  /**
   * Invalidate a specific key or keys matching prefix.
   */
  invalidate(keyOrPrefix?: string): void {
    if (!keyOrPrefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(`${keyOrPrefix}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Subscribe to cache updates for a given key.
   */
  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  private notify(key: string, data: any): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error("Cache subscriber error:", e);
        }
      });
    }
  }
}

export const dataCache = new DataCache();
