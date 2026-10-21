# Stage 1: Build stage
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /build

# Copy Maven wrapper and POM first for layer caching of dependencies
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Make wrapper executable and cache dependencies
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source code and build the executable jar
COPY src src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre

WORKDIR /app

# Install curl for Actuator health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user and group
RUN groupadd -r appgroup -g 1001 && \
    useradd -r -u 1001 -g appgroup -s /bin/sh -d /app appuser

# Copy jar from builder
COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar

USER appuser:appgroup

EXPOSE 8080

# Sensible container-aware JVM memory configuration
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Health check using Actuator health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Execute jar directly with signal propagation
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
