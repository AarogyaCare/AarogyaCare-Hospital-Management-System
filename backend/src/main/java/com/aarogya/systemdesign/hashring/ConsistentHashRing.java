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
        physicalNodes.add(node);
        for (int i = 0; i < numberOfReplicas; i++) {
            circle.put(hash(node + "#vnode_" + i), node);
        }
    }

    public synchronized void removeNode(String node) {
        physicalNodes.remove(node);
        for (int i = 0; i < numberOfReplicas; i++) {
            circle.remove(hash(node + "#vnode_" + i));
        }
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
     */
    public Map<String, Object> simulateNodeRemoval(String nodeToRemove, List<String> sampleKeys) {
        Map<String, String> beforeMap = new HashMap<>();
        for (String key : sampleKeys) {
            beforeMap.put(key, getNode(key));
        }

        removeNode(nodeToRemove);

        int remappedCount = 0;
        for (String key : sampleKeys) {
            String afterNode = getNode(key);
            if (!Objects.equals(beforeMap.get(key), afterNode)) {
                remappedCount++;
            }
        }

        // Restore node to ring
        addNode(nodeToRemove);

        double remappedPercent = (remappedCount / (double) sampleKeys.size()) * 100.0;
        Map<String, Object> results = new HashMap<>();
        results.put("removed_node", nodeToRemove);
        results.put("total_keys", sampleKeys.size());
        results.put("remapped_keys", remappedCount);
        results.put("remapped_percent", Math.round(remappedPercent * 100.0) / 100.0);
        results.put("expected_theoretical_percent", Math.round((1.0 / (physicalNodes.size())) * 10000.0) / 100.0);
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
