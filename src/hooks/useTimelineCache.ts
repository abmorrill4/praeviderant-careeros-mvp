
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useTimelineCache() {
  const queryClient = useQueryClient();

  const getCachedData = useCallback(<T>(key: string): T | null => {
    const cached = queryClient.getQueryData<CacheEntry<T>>(['timeline-cache', key]);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      queryClient.removeQueries({ queryKey: ['timeline-cache', key] });
      return null;
    }
    
    return cached.data;
  }, [queryClient]);

  const setCachedData = useCallback(<T>(key: string, data: T, ttl: number = CACHE_TTL) => {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    queryClient.setQueryData(['timeline-cache', key], cacheEntry);
  }, [queryClient]);

  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      queryClient.removeQueries({ queryKey: ['timeline-cache', key] });
    } else {
      queryClient.removeQueries({ queryKey: ['timeline-cache'] });
    }
  }, [queryClient]);

  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const timelineCacheEntries = cache.getAll().filter(
      query => query.queryKey[0] === 'timeline-cache'
    );
    
    return {
      totalEntries: timelineCacheEntries.length,
      cacheSize: JSON.stringify(timelineCacheEntries).length,
      oldestEntry: Math.min(
        ...timelineCacheEntries.map(entry => 
          (entry.state.data as CacheEntry<any>)?.timestamp || Date.now()
        )
      ),
    };
  }, [queryClient]);

  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    getCacheStats,
  };
}
