package com.aarogya;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableMongoAuditing
public class AarogyaApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(AarogyaApplication.class, args);
    }

    private static void loadDotEnv() {
        List<String> candidates = List.of(".env", "../.env");
        for (String candidate : candidates) {
            Path path = Paths.get(candidate);
            if (Files.exists(path)) {
                try {
                    for (String line : Files.readAllLines(path)) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                        int eq = trimmed.indexOf('=');
                        if (eq > 0) {
                            String key = trimmed.substring(0, eq).trim();
                            String val = trimmed.substring(eq + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
                break;
            }
        }
    }
}
