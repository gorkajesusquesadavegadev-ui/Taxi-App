package com.taya.security;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Duration;

/**
 * Limita peticiones por IP para frenar fuerza bruta y abuso. Ventana deslizante
 * en Redis (funciona con varias instancias). El login es el objetivo principal.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {
    private final StringRedisTemplate redis;
    public RateLimitFilter(StringRedisTemplate redis) { this.redis = redis; }

    // Límites por ventana de 60 s y por IP.
    private static final int MAX_LOGIN = 8;      // intentos de login/registro
    private static final int MAX_GENERAL = 120;  // resto de la API

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req, @NonNull HttpServletResponse res,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String path = req.getRequestURI();
        // No limita OPTIONS (preflight CORS) ni el health check.
        if ("OPTIONS".equalsIgnoreCase(req.getMethod()) || path.startsWith("/actuator")) {
            chain.doFilter(req, res); return;
        }
        boolean esAuth = path.startsWith("/api/auth/");
        int limite = esAuth ? MAX_LOGIN : MAX_GENERAL;
        String key = "rl:" + (esAuth ? "auth:" : "api:") + clientIp(req);

        long n;
        try {
            Long c = redis.opsForValue().increment(key);
            n = c == null ? 1 : c;
            if (n == 1) redis.expire(key, Duration.ofSeconds(60));
        } catch (Exception e) {
            chain.doFilter(req, res); return; // si Redis falla, no bloqueamos el servicio
        }

        if (n > limite) {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Demasiadas peticiones. Inténtalo en un minuto.\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    /** IP real detrás de proxy (Railway/Vercel usan X-Forwarded-For). */
    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
