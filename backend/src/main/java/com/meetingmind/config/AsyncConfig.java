package com.meetingmind.config;

import io.micrometer.context.ContextSnapshotFactory;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig implements WebMvcConfigurer {

    @Override
    public void configureAsyncSupport(@NonNull AsyncSupportConfigurer configurer) {
        // Set async request timeout to 10 minutes (600,000 ms)
        // Required for MCP SSE connections which are long-lived
        configurer.setDefaultTimeout(600_000);
    }

    /**
     * Override Tomcat's default 30-second async timeout at the connector level.
     * This is the lowest-level timeout and cannot be overridden by any library.
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatAsyncTimeoutCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            connector.setAsyncTimeout(600_000); // 10 minutes
        });
    }

    /**
     * Dedicated task executor for @Async methods (such as MeetingOrchestrator).
     * Decorated with ContextSnapshot to propagate MDC and distributed tracing context
     * across thread boundaries.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("meetingmind-async-");
        ContextSnapshotFactory snapshotFactory = ContextSnapshotFactory.builder().build();
        executor.setTaskDecorator(runnable -> snapshotFactory.captureAll().wrap(runnable));
        executor.initialize();
        return executor;
    }
}
