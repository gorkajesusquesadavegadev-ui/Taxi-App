package com.taya.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.web.cors.*;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {
    // Orígenes permitidos, configurables por entorno (coma-separados).
    // En local valen los puertos de Vite; en producción se pasa la URL de la web.
    @Value("${taya.cors.origins:http://localhost:5173,http://localhost:5174}")
    private String origins;

    @Bean CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
