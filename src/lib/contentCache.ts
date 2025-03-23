import { ContentCache, GeneratedContent } from '../types';

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

class ContentCacheManager {
  private cache: ContentCache = {};

  set(key: string, content: string): void {
    this.cache[key] = {
      content,
      timestamp: Date.now()
    };
  }

  get(key: string): string | null {
    const cached = this.cache[key];
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      delete this.cache[key];
      return null;
    }

    return cached.content;
  }

  clear(): void {
    this.cache = {};
  }
}

export const contentCache = new ContentCacheManager();