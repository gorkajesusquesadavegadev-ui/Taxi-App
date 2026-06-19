package com.taya.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.web.cors.*;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {
    // Patrones de orígenes permitidos (admiten comodín *), configurables por
    // entorno. Por defecto: local + cualquier subdominio de Vercel y del túnel
    // de Cloudflare, para que la web desplegada pueda llamar al backend.
    @Value("${taya.cors.origins:*}")
    private String origins;

    @Bean CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        if ("*".equals(origins.trim())) {
            cfg.addAllowedOriginPattern("*");
        } else {
            cfg.setAllowedOriginPatterns(Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
        }
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
