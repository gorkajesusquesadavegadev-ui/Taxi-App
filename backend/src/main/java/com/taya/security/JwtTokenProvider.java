package com.taya.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {
    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(@Value("${jwt.secret}") String secret,
                            @Value("${jwt.expiration}") long expirationMs) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalStateException("jwt.secret debe tener al menos 32 bytes");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generate(Long userId, String rol) {
        Date now = new Date();
        return Jwts.builder()
            .setId(UUID.randomUUID().toString()) // jti: identificador único (permite revocación)
            .setSubject(String.valueOf(userId))
            .claim("rol", rol)
            .setIssuedAt(now)
            .setExpiration(new Date(now.getTime() + expirationMs))
            .signWith(key, SignatureAlgorithm.HS256)
            .compact();
    }

    private Claims parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
            .parseClaimsJws(token).getBody();
    }
    public boolean isValid(String token) {
        try { parse(token); return true; } catch (JwtException | IllegalArgumentException e) { return false; }
    }
    public Long getUserId(String token) { return Long.valueOf(parse(token).getSubject()); }
    public String getRol(String token) { return parse(token).get("rol", String.class); }
    public String getJti(String token) { return parse(token).getId(); }
    /** Segundos que le quedan de vida al token (para caducar su entrada de revocación). */
    public long secondsToExpiry(String token) {
        long ms = parse(token).getExpiration().getTime() - System.currentTimeMillis();
        return Math.max(1, ms / 1000);
    }
}
