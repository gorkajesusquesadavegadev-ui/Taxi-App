package com.taya.security;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;

/**
 * Freno de fuerza bruta por CUENTA, además del que ya existe por IP.
 *
 * El límite por IP no sirve contra alguien que prueba contraseñas de una misma
 * cuenta repartiendo los intentos entre muchas direcciones — que es justo como
 * se hace: con una lista de contraseñas filtradas y una red de proxies, cada IP
 * envía dos o tres peticiones y ninguna llega al tope. Y subir el límite por IP
 * no es opción, porque muchos móviles comparten una sola IP del operador y
 * castigaría a usuarios legítimos.
 *
 * La cuenta se identifica por el hash del correo, no por el correo: así Redis
 * no guarda direcciones de nadie y el registro no añade datos personales
 * nuevos (art. 5.1.c del RGPD, minimización).
 *
 * Si Redis no responde, no se bloquea a nadie: preferimos dejar entrar a
 * dejar fuera a todo el mundo por una caída de la caché.
 */
@Component
public class IntentosLogin {

    private static final int MAX_FALLOS = 6;
    private static final Duration VENTANA = Duration.ofMinutes(15);

    private final StringRedisTemplate redis;

    public IntentosLogin(StringRedisTemplate redis) { this.redis = redis; }

    private static String clave(String email) {
        String normalizado = email == null ? "" : email.trim().toLowerCase();
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest(normalizado.getBytes(StandardCharsets.UTF_8));
            return "login:fallos:" + HexFormat.of().formatHex(h, 0, 16);
        } catch (Exception e) {
            return "login:fallos:" + Integer.toHexString(normalizado.hashCode());
        }
    }

    /**
     * Se llama ANTES de comprobar la contraseña. Si la cuenta está frenada,
     * corta aquí: así un atacante no gasta ni un bcrypt del servidor.
     */
    public void comprobar(String email) {
        try {
            String v = redis.opsForValue().get(clave(email));
            if (v == null) return;
            if (Integer.parseInt(v) < MAX_FALLOS) return;
            Long quedan = redis.getExpire(clave(email));
            long min = quedan != null && quedan > 0 ? Math.max(1, quedan / 60) : VENTANA.toMinutes();
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Demasiados intentos fallidos con esta cuenta. Espera " + min
                + (min == 1 ? " minuto e inténtalo otra vez." : " minutos e inténtalo otra vez."));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            // Redis caído o valor corrupto: no se bloquea.
        }
    }

    /** Contraseña incorrecta. Se cuenta igual exista la cuenta o no, para no
     *  dar pistas sobre qué correos están registrados. */
    public void fallo(String email) {
        try {
            String k = clave(email);
            Long n = redis.opsForValue().increment(k);
            if (n != null && n == 1L) redis.expire(k, VENTANA);
        } catch (Exception ignored) { /* sin Redis no se cuenta */ }
    }

    /** Entrada correcta: se olvida lo anterior. */
    public void acierto(String email) {
        try { redis.delete(clave(email)); } catch (Exception ignored) { }
    }
}
