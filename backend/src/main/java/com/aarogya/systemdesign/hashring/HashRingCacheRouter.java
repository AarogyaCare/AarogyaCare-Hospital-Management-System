package com.aarogya.systemdesign.hashring;

import com.aarogya.systemdesign.cache.CacheService;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * HashRingCacheRouter integrates the Consistent Hash Ring with the distributed caching tier.
 * In single-instance deployment, it maps keys deterministically to partitioned namespaces
 * across the virtual nodes of the ring, ensuring verifiable key locality and remapping dynamics.
 */
@Service
public class HashRingCacheRouter {

    private final ConsistentHashRing hashRing;
    private final CacheService cacheService;
    private final ConcurrentHashMap<String, AtomicLong> nodeRequestCounters = new ConcurrentHashMap<>();

    public HashRingCacheRouter(ConsistentHashRing hashRing, CacheService cacheService) {
        this.hashRing = hashRing;
        this.cacheService = cacheService;
        for (String node : hashRing.getPhysicalNodes()) {
            nodeRequestCounters.put(node, new AtomicLong(0));
        }
    }

    public String routeKey(String key) {
        String targetNode = hashRing.getNode(key);
        if (targetNode != null) {
            nodeRequestCounters.computeIfAbsent(targetNode, k -> new AtomicLong(0)).incrementAndGet();
        }
        return targetNode;
    }

    public <T> T get(String logicalKey, Class<T> clazz) {
        String targetNode = routeKey(logicalKey);
        String partitionedKey = "part:" + targetNode + ":" + logicalKey;
        return cacheService.get(partitionedKey, clazz);
    }

    public void set(String logicalKey, Object value, Duration ttl) {
        String targetNode = routeKey(logicalKey);
        String partitionedKey = "part:" + targetNode + ":" + logicalKey;
        cacheService.set(partitionedKey, value, ttl);
    }

    public void evict(String logicalKey) {
        String targetNode = routeKey(logicalKey);
        String partitionedKey = "part:" + targetNode + ":" + logicalKey;
        cacheService.evict(partitionedKey);
    }

    public void addNode(String nodeName) {
        hashRing.addNode(nodeName);
        nodeRequestCounters.putIfAbsent(nodeName, new AtomicLong(0));
    }

    public void removeNode(String nodeName) {
        hashRing.removeNode(nodeName);
        nodeRequestCounters.remove(nodeName);
    }

    public Set<String> getNodes() {
        return hashRing.getPhysicalNodes();
    }

    public int getVnodeCount() {
        return hashRing.getTotalVnodeCount();
    }

    public Map<String, Object> getDistributionStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("physical_nodes", hashRing.getPhysicalNodes());
        stats.put("physical_node_count", hashRing.getPhysicalNodeCount());
        stats.put("total_vnodes", hashRing.getTotalVnodeCount());
        Map<String, Long> counters = new HashMap<>();
        nodeRequestCounters.forEach((k, v) -> counters.put(k, v.get()));
        stats.put("request_distribution", counters);
        return stats;
    }

    public Map<String, Object> simulateNodeRemoval(String nodeToRemove, List<String> sampleKeys) {
        return hashRing.simulateNodeRemoval(nodeToRemove, sampleKeys);
    }
}
