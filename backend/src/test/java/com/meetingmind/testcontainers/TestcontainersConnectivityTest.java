package com.meetingmind.testcontainers;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Duration;
import java.util.Collections;
import java.util.Properties;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TestcontainersConnectivityTest extends BaseKafkaIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Test
    @DisplayName("Verify PostgreSQL Testcontainer connectivity and dynamic port mapping")
    void testPostgresContainerConnectivity() {
        assertTrue(postgresContainer.isRunning(), "PostgreSQL container must be running");
        assertNotEquals(5432, postgresContainer.getFirstMappedPort(), "PostgreSQL should map to an ephemeral dynamic port");
        
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertEquals(1, result, "PostgreSQL should respond to queries");

        String dbName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
        assertEquals("meetingmind_test", dbName, "Database name should match configuration");
    }

    @Test
    @DisplayName("Verify Redis Testcontainer connectivity and cache operations")
    void testRedisContainerConnectivity() {
        assertTrue(redisContainer.isRunning(), "Redis container must be running");
        assertNotEquals(6379, redisContainer.getFirstMappedPort(), "Redis should map to an ephemeral dynamic port");

        String testKey = "tc:test:" + UUID.randomUUID();
        String testVal = "testcontainers-active";

        stringRedisTemplate.opsForValue().set(testKey, testVal, Duration.ofSeconds(60));
        String fetched = stringRedisTemplate.opsForValue().get(testKey);

        assertEquals(testVal, fetched, "Redis should store and return value");
        stringRedisTemplate.delete(testKey);
    }

    @Test
    @DisplayName("Verify Kafka Testcontainer connectivity, publishing, and consumption")
    void testKafkaContainerConnectivity() {
        assertTrue(kafkaContainer.isRunning(), "Kafka container must be running");
        assertNotNull(kafkaContainer.getBootstrapServers());

        String topic = "tc-connectivity-topic-" + UUID.randomUUID();
        String key = "test-key";
        String message = "hello-from-testcontainers";

        // Producer properties
        Properties producerProps = new Properties();
        producerProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaContainer.getBootstrapServers());
        producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

        try (KafkaProducer<String, String> producer = new KafkaProducer<>(producerProps)) {
            producer.send(new ProducerRecord<>(topic, key, message));
            producer.flush();
        }

        // Consumer properties
        Properties consumerProps = new Properties();
        consumerProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaContainer.getBootstrapServers());
        consumerProps.put(ConsumerConfig.GROUP_ID_CONFIG, "tc-test-group-" + UUID.randomUUID());
        consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(consumerProps)) {
            consumer.subscribe(Collections.singletonList(topic));
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(10));
            assertFalse(records.isEmpty(), "Consumer should receive the produced record");
            ConsumerRecord<String, String> record = records.iterator().next();
            assertEquals(key, record.key());
            assertEquals(message, record.value());
        }
    }
}
