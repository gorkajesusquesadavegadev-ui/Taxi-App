package com.taya.config;
import com.taya.security.JwtAuthFilter;
import com.taya.security.RateLimitFilter;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    private final JwtAuthFilter jwtFilter;
    private final RateLimitFilter rateLimitFilter;
    public SecurityConfig(JwtAuthFilter jwtFilter, RateLimitFilter rateLimitFilter) {
        this.jwtFilter = jwtFilter; this.rateLimitFilter = rateLimitFilter;
    }

    @Bean SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(c -> {})
            .csrf(c -> c.disable()) // API stateless con JWT (no cookies de sesión) → CSRF no aplica
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Cabeceras de seguridad HTTP (defensa en profundidad).
            .headers(h -> h
                .frameOptions(f -> f.deny())                                   // anti clickjacking
                .contentTypeOptions(c -> {})                                   // X-Content-Type-Options: nosniff
                .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN))
                .httpStrictTransportSecurity(hsts -> hsts                        // fuerza HTTPS 2 años
                    .includeSubDomains(true).maxAgeInSeconds(63072000))
                .addHeaderWriter((req, res) -> {
                    res.setHeader("X-XSS-Protection", "0"); // desactivado a propósito (obsoleto, CSP es mejor)
                    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
                    res.setHeader("Permissions-Policy", "geolocation=(self), camera=(), microphone=(self)");
                }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**", "/ws/**", "/error").permitAll()
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/push/vapid-public-key").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/viajes/seguir/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/taxista/**").hasRole("TAXISTA")
                .anyRequest().authenticated())
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); } // coste 12 (más fuerte)
    @Bean AuthenticationManager authManager(AuthenticationConfiguration c) throws Exception { return c.getAuthenticationManager(); }
}
