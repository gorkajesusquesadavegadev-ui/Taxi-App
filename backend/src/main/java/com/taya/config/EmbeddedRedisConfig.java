package com.taya.config;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import redis.embedded.RedisServer;
import java.net.Socket;

@Configuration
@Profile("local")
public class EmbeddedRedisConfig {
    private RedisServer server;
    private final int port;

    public EmbeddedRedisConfig(@Value("${spring.data.redis.port:6379}") int port) {
        this.port = port;
    }

    @PostConstruct
    public void start() throws Exception {
        try (Socket s = new Socket("127.0.0.1", port)) {
            // port already in use — system Redis running, skip embedded
            return;
        } catch (Exception ignored) {}
        server = new RedisServer(port);
        server.start();
    }

    @PreDestroy
    public void stop() throws Exception {
        if (server != null) server.stop();
    }
}
