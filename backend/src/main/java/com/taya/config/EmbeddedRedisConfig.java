package com.taya.config;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import redis.embedded.RedisServer;

/**
 * Starts an in-process Redis (bundled binary) when the {@code local} profile is active,
 * so the app runs end-to-end without Docker or a system Redis install.
 */
@Configuration
@Profile("local")
public class EmbeddedRedisConfig {
    private final RedisServer server;

    public EmbeddedRedisConfig(@Value("${spring.data.redis.port:6379}") int port) throws Exception {
        this.server = new RedisServer(port);
    }

    @PostConstruct
    public void start() throws Exception {
        server.start();
    }

    @PreDestroy
    public void stop() throws Exception {
        server.stop();
    }
}
