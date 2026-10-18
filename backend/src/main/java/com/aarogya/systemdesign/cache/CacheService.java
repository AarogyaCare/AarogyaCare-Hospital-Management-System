package com.aarogya.systemdesign.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class CacheService {

    private static final Logger logger = LoggerFactory.getLogger(CacheService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ConcurrentHashMap<String, Object> localFallbackCache = new ConcurrentHashMap<>();

    private final AtomicLong cacheHits = new AtomicLong(0L);
    private final AtomicLong cacheMisses = new AtomicLong(0L);

    public CacheService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                cacheHits.incrementAndGet();
                return clazz.cast(value);
            }
        } catch (Exception ex) {
            logger.warn("Redis get failed for key: {}. Falling back to memory: {}", key, ex.getMessage());
            Object fallback = localFallbackCache.get(key);
            if (fallback != null) {
                cacheHits.incrementAndGet();
                return clazz.cast(fallback);
            }
        }

        cacheMisses.incrementAndGet();
        return null;
    }

    public void set(String key, Object value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl);
        } catch (Exception ex) {
            logger.warn("Redis set failed for key: {}. Using memory fallback: {}", key, ex.getMessage());
            localFallbackCache.put(key, value);
        }
    }

    public void evict(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception ex) {
            logger.warn("Redis evict failed for key: {}", key);
        }
        localFallbackCache.remove(key);
    }

    public double getHitRatio() {
        long hits = cacheHits.get();
        long misses = cacheMisses.get();
        long total = hits + misses;
        if (total == 0) return 1.0;
        return (double) hits / total;
    }

    public long getCacheHits() { return cacheHits.get(); }
    public long getCacheMisses() { return cacheMisses.get(); }
}
