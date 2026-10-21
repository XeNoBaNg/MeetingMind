package com.meetingmind.testcontainers;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

/**
 * Foundational base class for Spring Boot integration tests backed by Testcontainers.
 * Provides singleton PostgreSQL and Redis containers shared across all test classes
 * extending this base. Ephemeral mapped ports eliminate conflicts with local services.
 * Automatic lifecycle management via Testcontainers' Ryuk reaper ensures resource cleanup.
 */
@ActiveProfiles("test")
@SuppressWarnings("resource")
public abstract class BaseIntegrationTest {

    protected static final PostgreSQLContainer<?> postgresContainer;
    protected static final GenericContainer<?> redisContainer;

    static {
        postgresContainer = new PostgreSQLContainer<>(
                DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres")
        )
                .withDatabaseName("meetingmind_test")
                .withUsername("testuser")
                .withPassword("testpass")
                .waitingFor(Wait.forListeningPort());
        postgresContainer.start();

        redisContainer = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
                .withExposedPorts(6379)
                .waitingFor(Wait.forListeningPort());
        redisContainer.start();
    }

    @DynamicPropertySource
    static void registerDynamicProperties(DynamicPropertyRegistry registry) {
        // Dynamic PostgreSQL properties
        registry.add("spring.datasource.url", postgresContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgresContainer::getUsername);
        registry.add("spring.datasource.password", postgresContainer::getPassword);
        registry.add("spring.datasource.driver-class-name", postgresContainer::getDriverClassName);

        // Dynamic Redis properties
        registry.add("spring.data.redis.host", redisContainer::getHost);
        registry.add("spring.data.redis.port", () -> redisContainer.getMappedPort(6379));
    }
}
