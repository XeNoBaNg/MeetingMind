package com.meetingmind.config;

import org.apache.catalina.connector.Connector;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableAsync
public class AsyncConfig implements WebMvcConfigurer {

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
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
}
