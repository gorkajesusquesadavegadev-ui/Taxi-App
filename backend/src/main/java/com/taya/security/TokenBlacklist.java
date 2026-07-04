package com.taya.security;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import java.time.Duration;

/**
 * Lista de tokens revocados (logout). Guarda el jti en Redis hasta que el token
 * caducaría de todos modos, así la entrada se auto-limpia. Compartida entre
 * instancias, por lo que un logout invalida el token en todo el backend.
 */
@Component
public class TokenBlacklist {
    private final StringRedisTemplate redis;
    public TokenBlacklist(StringRedisTemplate redis) { this.redis = redis; }

    public void revocar(String jti, long segundos) {
        if (jti == null) return;
        try { redis.opsForValue().set("jwt:revoked:" + jti, "1", Duration.ofSeconds(segundos)); }
        catch (Exception ignored) {}
    }

    public boolean estaRevocado(String jti) {
        if (jti == null) return false;
        try { return Boolean.TRUE.equals(redis.hasKey("jwt:revoked:" + jti)); }
        catch (Exception e) { return false; } // si Redis falla, no bloqueamos el login legítimo
    }
}
