package com.taya.controller;
import com.taya.dto.request.*;
import com.taya.dto.response.AuthResponse;
import com.taya.security.JwtTokenProvider;
import com.taya.security.TokenBlacklist;
import com.taya.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final JwtTokenProvider jwt;
    private final TokenBlacklist blacklist;
    public AuthController(AuthService auth, JwtTokenProvider jwt, TokenBlacklist blacklist) {
        this.auth = auth; this.jwt = jwt; this.blacklist = blacklist;
    }
    @PostMapping("/register") public AuthResponse register(@Valid @RequestBody RegisterRequest r) { return auth.register(r); }
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest r) { return auth.login(r); }
    @PostMapping("/google") public AuthResponse google(@Valid @RequestBody GoogleAuthRequest r) { return auth.loginConGoogle(r.idToken()); }

    /** Logout real: revoca el token actual en todo el backend hasta que caduque. */
    @PostMapping("/logout")
    public void logout(HttpServletRequest req) {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            String token = h.substring(7);
            try { blacklist.revocar(jwt.getJti(token), jwt.secondsToExpiry(token)); }
            catch (Exception ignored) {}
        }
    }
}
