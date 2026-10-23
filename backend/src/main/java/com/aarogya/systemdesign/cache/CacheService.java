package com.aarogya.systemdesign.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;

@Service
public class CacheService {

    private static final Logger logger = LoggerFactory.getLogger(CacheService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private final ConcurrentHashMap<String, Object> localFallbackCache = new ConcurrentHashMap<>();

    private final AtomicLong cacheHits = new AtomicLong(0L);
    private final AtomicLong cacheMisses = new AtomicLong(0L);

    public CacheService(RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);

            if (value != null) {
                cacheHits.incrementAndGet();
                return convertValue(value, clazz);
            }
        } catch (Exception ex) {
            logger.warn("Redis get failed for key: {}. Falling back to memory: {}", key, ex.getMessage());
        }

        Object fallback = localFallbackCache.get(key);

        if (fallback != null) {
            try {
                cacheHits.incrementAndGet();
                return convertValue(fallback, clazz);
            } catch (Exception ex) {
                logger.warn("Local cache conversion failed for key: {}", key);
            }
        }

        cacheMisses.incrementAndGet();
        return null;
    }

    public <T> T getOrLoad(String key, Duration ttl, Class<T> clazz, Supplier<T> dbLoader) {
        T cachedValue = get(key, clazz);

        if (cachedValue != null) {
            return cachedValue;
        }

        T freshData = dbLoader.get();

        if (freshData != null) {
            set(key, freshData, ttl);
        }

        return freshData;
    }

    public <T> T getOrLoad(String key, Duration ttl, TypeReference<T> typeReference, Supplier<T> dbLoader) {
        T cachedValue = get(key, typeReference);

        if (cachedValue != null) {
            return cachedValue;
        }

        T freshData = dbLoader.get();

        if (freshData != null) {
            set(key, freshData, ttl);
        }

        return freshData;
    }

    public <T> T get(String key, TypeReference<T> typeReference) {
        try {
            Object value = redisTemplate.opsForValue().get(key);

            if (value != null) {
                T convertedValue = convertValue(value, typeReference);
                cacheHits.incrementAndGet();
                return convertedValue;
            }
        } catch (Exception ex) {
            logger.warn("Redis get failed for key: {}. Falling back to memory: {}", key, ex.getMessage());
        }

        Object fallback = localFallbackCache.get(key);

        if (fallback != null) {
            try {
                T convertedValue = convertValue(fallback, typeReference);
                cacheHits.incrementAndGet();
                return convertedValue;
            } catch (Exception ex) {
                logger.warn("Local cache conversion failed for key: {}", key);
            }
        }

        cacheMisses.incrementAndGet();
        return null;
    }

    public void set(String key, Object value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl);
            localFallbackCache.remove(key);
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

    public void evictByPrefix(String prefix) {
        try {
            Set<String> keys = redisTemplate.keys(prefix + "*");

            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception ex) {
            logger.warn("Redis cache invalidation failed for prefix: {}", prefix);
        }

        localFallbackCache.keySet().removeIf(key -> key.startsWith(prefix));
    }

    public double getHitRatio() {
        long hits = cacheHits.get();
        long misses = cacheMisses.get();
        long total = hits + misses;

        if (total == 0) {
            return 1.0;
        }

        return (double) hits / total;
    }

    public long getCacheHits() {
        return cacheHits.get();
    }

    public long getCacheMisses() {
        return cacheMisses.get();
    }

    private <T> T convertValue(Object value, Class<T> clazz) {
        if (clazz.isInstance(value)) {
            return clazz.cast(value);
        }

        return objectMapper.convertValue(value, clazz);
    }

    private <T> T convertValue(Object value, TypeReference<T> typeReference) {
        return objectMapper.convertValue(value, typeReference);
    }
}