package com.meetingmind.testcontainers;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.kafka.ConfluentKafkaContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Base integration test class for tests that require a live Kafka broker alongside
 * PostgreSQL and Redis. Statically initializes a singleton Kafka Testcontainer.
 */
public abstract class BaseKafkaIntegrationTest extends BaseIntegrationTest {

    protected static final ConfluentKafkaContainer kafkaContainer;

    static {
        kafkaContainer = new ConfluentKafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));
        kafkaContainer.start();
    }

    @DynamicPropertySource
    static void registerKafkaProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafkaContainer::getBootstrapServers);
        registry.add("spring.kafka.listener.auto-startup", () -> "true");
        registry.add("spring.kafka.consumer.auto-offset-reset", () -> "earliest");
    }
}
