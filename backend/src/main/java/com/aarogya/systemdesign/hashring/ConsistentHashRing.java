package com.aarogya.systemdesign.hashring;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.ConcurrentSkipListMap;

@Service
public class ConsistentHashRing {

    private final int numberOfReplicas; // Virtual nodes per physical node
    private final SortedMap<Long, String> circle = new ConcurrentSkipListMap<>();
    private final Set<String> physicalNodes = Collections.synchronizedSet(new HashSet<>());

    public ConsistentHashRing() {
        this(150); // Default 150 virtual nodes
    }

    public ConsistentHashRing(int numberOfReplicas) {
        this.numberOfReplicas = numberOfReplicas;
        // Initialize default 3-node cluster
        addNode("redis-cache-a");
        addNode("redis-cache-b");
        addNode("redis-cache-c");
    }

    public synchronized void addNode(String node) {
        if (node == null || node.isBlank() || physicalNodes.contains(node)) {
            return;
        }
        physicalNodes.add(node);
        for (int i = 0; i < numberOfReplicas; i++) {
            long h = hash(node + "#vnode_" + i);
            while (circle.containsKey(h) && !node.equals(circle.get(h))) {
                h++; // Deliberately handle hash collision without silent overwriting
            }
            circle.put(h, node);
        }
    }

    public synchronized void removeNode(String node) {
        if (node == null) return;
        physicalNodes.remove(node);
        circle.values().removeIf(node::equals);
    }

    public String getNode(String key) {
        if (circle.isEmpty()) {
            return null;
        }
        long hash = hash(key);
        if (!circle.containsKey(hash)) {
            SortedMap<Long, String> tailMap = circle.tailMap(hash);
            hash = tailMap.isEmpty() ? circle.firstKey() : tailMap.firstKey();
        }
        return circle.get(hash);
    }

    public int getPhysicalNodeCount() {
        return physicalNodes.size();
    }

    public int getTotalVnodeCount() {
        return circle.size();
    }

    public Set<String> getPhysicalNodes() {
        return Collections.unmodifiableSet(physicalNodes);
    }

    /**
     * Measures key remapping percentage when a node is removed from the ring.
     * CRITICAL: Uses an isolated copy of the ring to prevent exposing temporary
     * ring mutation or downtime to concurrent production requests.
     */
    public Map<String, Object> simulateNodeRemoval(String nodeToRemove, List<String> sampleKeys) {
        if (sampleKeys == null || sampleKeys.isEmpty()) {
            return Map.of("removed_node", nodeToRemove, "total_keys", 0, "remapped_keys", 0, "remapped_percent", 0.0);
        }

        Map<String, String> beforeMap = new HashMap<>();
        for (String key : sampleKeys) {
            beforeMap.put(key, getNode(key));
        }

        // Create an isolated simulated ring WITHOUT mutating the live production circle
        SortedMap<Long, String> simCircle = new ConcurrentSkipListMap<>();
        for (Map.Entry<Long, String> entry : circle.entrySet()) {
            if (!entry.getValue().equals(nodeToRemove)) {
                simCircle.put(entry.getKey(), entry.getValue());
            }
        }

        int remappedCount = 0;
        if (!simCircle.isEmpty()) {
            for (String key : sampleKeys) {
                long h = hash(key);
                SortedMap<Long, String> tailMap = simCircle.tailMap(h);
                long targetHash = tailMap.isEmpty() ? simCircle.firstKey() : tailMap.firstKey();
                String afterNode = simCircle.get(targetHash);
                if (!Objects.equals(beforeMap.get(key), afterNode)) {
                    remappedCount++;
                }
            }
        }

        double remappedPercent = (remappedCount / (double) sampleKeys.size()) * 100.0;
        int activeNodeCount = physicalNodes.size();
        double theoreticalPercent = activeNodeCount > 0 ? (1.0 / activeNodeCount) * 100.0 : 0.0;

        Map<String, Object> results = new HashMap<>();
        results.put("removed_node", nodeToRemove);
        results.put("total_keys", sampleKeys.size());
        results.put("remapped_keys", remappedCount);
        results.put("remapped_percent", Math.round(remappedPercent * 100.0) / 100.0);
        results.put("expected_theoretical_percent", Math.round(theoreticalPercent * 100.0) / 100.0);
        return results;
    }

    private long hash(String key) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(key.getBytes(StandardCharsets.UTF_8));
            long h = 0;
            for (int i = 0; i < 4; i++) {
                h <<= 8;
                h |= ((int) digest[i]) & 0xFF;
            }
            return h;
        } catch (NoSuchAlgorithmException e) {
            return key.hashCode() & 0xFFFFFFFFL;
        }
    }
}
