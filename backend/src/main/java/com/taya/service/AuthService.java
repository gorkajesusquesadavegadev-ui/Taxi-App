package com.taya.service;
import com.taya.dto.request.*;
import com.taya.dto.response.AuthResponse;
import com.taya.model.Rol;
import com.taya.model.Usuario;
import com.taya.repository.UsuarioRepository;
import com.taya.security.JwtTokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.security.GeneralSecurityException;
import java.io.IOException;
import java.util.Collections;

@Service
public class AuthService {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;
    private final GoogleIdTokenVerifier googleVerifier;

    public AuthService(UsuarioRepository u, PasswordEncoder e, JwtTokenProvider j,
                        @Value("${google.client-id:}") String googleClientId) {
        this.usuarios = u; this.encoder = e; this.jwt = j;
        // Sin GOOGLE_CLIENT_ID configurado, /auth/google queda deshabilitado
        // (verifier null) en vez de arrancar roto — útil en local/dev.
        this.googleVerifier = googleClientId.isBlank() ? null : new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(Collections.singletonList(googleClientId))
            .build();
    }

    public AuthResponse register(RegisterRequest r) {
        if (usuarios.existsByEmail(r.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email ya registrado");
        Usuario u = new Usuario();
        u.setNombre(r.nombre()); u.setEmail(r.email());
        u.setPasswordHash(encoder.encode(r.password())); u.setRol(r.rol());
        u.setLicencia(r.licencia()); u.setVehiculoMatricula(r.vehiculoMatricula());
        u.setVehiculoModelo(r.vehiculoModelo()); u.setTelefono(r.telefono());
        u = usuarios.save(u);
        return new AuthResponse(jwt.generate(u.getId(), u.getRol().name()), u.getId(), u.getNombre(), u.getRol().name());
    }

    public AuthResponse login(LoginRequest r) {
        Usuario u = usuarios.findByEmail(r.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "credenciales inválidas"));
        // Cuenta creada por "Continuar con Google": no tiene contraseña propia.
        if (u.getPasswordHash() == null || !encoder.matches(r.password(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "credenciales inválidas");
        if (u.isBloqueado())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "cuenta bloqueada. Contacta con soporte.");
        return new AuthResponse(jwt.generate(u.getId(), u.getRol().name()), u.getId(), u.getNombre(), u.getRol().name());
    }

    /**
     * "Continuar con Google": verifica el id_token (firma + audiencia + no
     * caducado) contra los servidores de Google, nunca nos fiamos del cliente.
     * Primer login con esa cuenta de Google → crea usuario CLIENTE nuevo (los
     * taxistas siguen registrándose con el formulario, que pide licencia y
     * documentos). Si ya existe una cuenta con ese email (creada antes con
     * contraseña normal), se vincula en vez de duplicar.
     */
    public AuthResponse loginConGoogle(String idTokenStr) {
        if (googleVerifier == null)
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google Sign-In no configurado");

        GoogleIdToken idToken;
        try {
            idToken = googleVerifier.verify(idTokenStr);
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "token de Google inválido");
        }
        if (idToken == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "token de Google inválido");

        GoogleIdToken.Payload payload = idToken.getPayload();
        if (!Boolean.TRUE.equals(payload.getEmailVerified()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "email de Google no verificado");
        String sub = payload.getSubject();
        String email = payload.getEmail();
        String nombre = (String) payload.get("name");
        if (nombre == null || nombre.isBlank()) nombre = email.split("@")[0];

        Usuario u = usuarios.findByGoogleSub(sub)
            .or(() -> usuarios.findByEmail(email))
            .orElseGet(() -> {
                Usuario nuevo = new Usuario();
                nuevo.setEmail(email);
                nuevo.setRol(Rol.CLIENTE);
                return nuevo;
            });
        u.setNombre(nombre);
        if (u.getGoogleSub() == null) u.setGoogleSub(sub); // vincula cuenta existente o fija la nueva
        u = usuarios.save(u);

        if (u.isBloqueado())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "cuenta bloqueada. Contacta con soporte.");
        return new AuthResponse(jwt.generate(u.getId(), u.getRol().name()), u.getId(), u.getNombre(), u.getRol().name());
    }
}
