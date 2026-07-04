package com.taya.config;
import com.taya.websocket.WsRelay;
import org.springframework.context.annotation.*;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class RedisConfig {
    @Bean StringRedisTemplate stringRedisTemplate(RedisConnectionFactory f) {
        return new StringRedisTemplate(f);
    }

    /** Contenedor de suscripción: reparte los eventos WS entre instancias. */
    @Bean
    RedisMessageListenerContainer wsListenerContainer(RedisConnectionFactory f, WsRelay relay) {
        var container = new RedisMessageListenerContainer();
        container.setConnectionFactory(f);
        container.addMessageListener(relay, new PatternTopic(WsRelay.CHANNEL));
        return container;
    }
}
