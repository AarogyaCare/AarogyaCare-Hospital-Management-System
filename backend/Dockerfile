# Stage 1: Build Java Spring Boot Application
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Create dedicated unprivileged non-root user
RUN addgroup -g 1001 aarogya && \
    adduser -u 1001 -G aarogya -s /bin/sh -D aarogya

# Copy compiled executable JAR from builder
COPY --from=builder --chown=aarogya:aarogya /build/target/aarogya-backend-1.0.0.jar /app/aarogya-backend.jar

USER aarogya:aarogya

EXPOSE 8000

ENV SERVER_PORT=8000 \
    MONGODB_URI=mongodb://mongos:27017/aarogya \
    SPRING_DATA_REDIS_HOST=redis \
    SPRING_DATA_REDIS_PORT=6379

ENTRYPOINT ["java", "-jar", "/app/aarogya-backend.jar"]
