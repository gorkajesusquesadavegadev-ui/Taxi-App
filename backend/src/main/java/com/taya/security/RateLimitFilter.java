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
    //
    // Ojo con bajar MAX_LOGIN: muchos móviles salen a internet compartiendo una
    // sola IP pública del operador (CGNAT), así que el cupo no es "por persona"
    // sino por todo un grupo de usuarios. Con 8 bastaba que un par de personas
    // se equivocaran de contraseña a la vez para que el resto viera
    // «Demasiadas peticiones» sin haber hecho nada.
    private static final int MAX_LOGIN = 30;     // intentos de login/registro
    private static final int MAX_GENERAL = 120;  // resto de la API
    private static final int VENTANA_SEG = 60;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req, @NonNull HttpServletResponse res,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String path = req.getRequestURI();
        // No limita OPTIONS (preflight CORS) ni el health check.
        if ("OPTIONS".equalsIgnoreCase(req.getMethod()) || path.startsWith("/actuator")) {
            chain.doFilter(req, res); return;
        }
        // Cerrar sesión no es un intento de acceso: no debe gastar cupo de login.
        if (path.equals("/api/auth/logout")) { chain.doFilter(req, res); return; }

        boolean esAuth = path.startsWith("/api/auth/");
        int limite = esAuth ? MAX_LOGIN : MAX_GENERAL;
        String key = "rl:" + (esAuth ? "auth:" : "api:") + clientIp(req);

        long n;
        try {
            Long c = redis.opsForValue().increment(key);
            n = c == null ? 1 : c;
            if (n == 1) redis.expire(key, Duration.ofSeconds(VENTANA_SEG));
        } catch (Exception e) {
            chain.doFilter(req, res); return; // si Redis falla, no bloqueamos el servicio
        }

        if (n > limite) {
            Long quedan = null;
            try { quedan = redis.getExpire(key); } catch (Exception ignored) { /* da igual */ }
            long segundos = quedan != null && quedan > 0 ? quedan : VENTANA_SEG;

            res.setStatus(429);
            // El charset es obligatorio: sin él el writer usa ISO-8859-1 y la
            // tilde de «Inténtalo» llegaba al navegador como «Int?ntalo».
            res.setContentType("application/json;charset=UTF-8");
            res.setCharacterEncoding("UTF-8");
            res.setHeader("Retry-After", String.valueOf(segundos));
            // Mismo campo que usa el resto de la API para el texto de error.
            res.getWriter().write(
                "{\"detail\":\"Demasiados intentos seguidos. Espera " + segundos + " segundos y prueba otra vez.\"}");
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
