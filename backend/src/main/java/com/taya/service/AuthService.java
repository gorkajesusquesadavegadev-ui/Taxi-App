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
    /** Versión del texto legal aceptado. Subirla al cambiar la política obliga
     *  a distinguir quién aceptó qué. */
    public static final String POLITICA_VERSION = "2026-08";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;
    private final GoogleIdTokenVerifier googleVerifier;
    private final com.taya.security.IntentosLogin intentos;

    public AuthService(UsuarioRepository u, PasswordEncoder e, JwtTokenProvider j,
                        com.taya.security.IntentosLogin intentos,
                        @Value("${google.client-id:}") String googleClientId) {
        this.usuarios = u; this.encoder = e; this.jwt = j; this.intentos = intentos;
        // Sin GOOGLE_CLIENT_ID configurado, /auth/google queda deshabilitado
        // (verifier null) en vez de arrancar roto — útil en local/dev.
        this.googleVerifier = googleClientId.isBlank() ? null : new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(Collections.singletonList(googleClientId))
            .build();
    }

    public AuthResponse register(RegisterRequest r) {
        if (usuarios.existsByEmail(r.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo. Inicia sesión o usa otro.");
        // El rol llega en el cuerpo de la peticion, asi que un registro publico
        // NO puede crear administradores: cualquiera mandaba {"rol":"ADMIN"} y se
        // colaba en el panel. Solo se admite CLIENTE o TAXISTA; ADMIN se crea
        // aparte (DataSeeder, con ADMIN_PASSWORD). Ante cualquier otro valor, se
        // trata como CLIENTE en vez de fallar: menos privilegio por defecto.
        if (r.rol() != Rol.CLIENTE && r.rol() != Rol.TAXISTA)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elige si viajas o conduces.");
        Usuario u = new Usuario();
        u.setNombre(r.nombre()); u.setEmail(r.email());
        u.setPasswordHash(encoder.encode(r.password())); u.setRol(r.rol());
        u.setLicencia(r.licencia()); u.setVehiculoMatricula(r.vehiculoMatricula());
        u.setVehiculoModelo(r.vehiculoModelo()); u.setTelefono(r.telefono());
        // Queda constancia de cuándo aceptó y a qué versión del texto: sin esto
        // el consentimiento no es demostrable y, a efectos del RGPD, es como no
        // tenerlo (art. 7.1, el responsable debe poder acreditarlo).
        u.setConsentimientoEn(java.time.Instant.now());
        u.setConsentimientoVersion(POLITICA_VERSION);
        u = usuarios.save(u);
        return new AuthResponse(jwt.generate(u.getId(), u.getRol().name()), u.getId(), u.getNombre(), u.getRol().name());
    }

    public AuthResponse login(LoginRequest r) {
        // Freno por cuenta antes de tocar la base de datos: si esta cuenta
        // lleva demasiados fallos seguidos, el intento se corta aquí y no se
        // gasta ni una comprobación de bcrypt.
        intentos.comprobar(r.email());

        Usuario u = usuarios.findByEmail(r.email()).orElse(null);
        // Cuenta creada por "Continuar con Google": no tiene contraseña propia.
        if (u == null || u.getPasswordHash() == null || !encoder.matches(r.password(), u.getPasswordHash())) {
            // Se cuenta el fallo exista la cuenta o no, y se responde lo mismo
            // en los dos casos: si no, el mensaje diría qué correos están
            // registrados.
            intentos.fallo(r.email());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos");
        }
        intentos.acierto(r.email());
        if (u.isBloqueado())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu cuenta está bloqueada. Escribe a gorkajesusquesadavegadev@gmail.com para recuperarla.");
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
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "El acceso con Google no está disponible ahora mismo. Entra con tu correo y contraseña.");

        GoogleIdToken idToken;
        try {
            idToken = googleVerifier.verify(idTokenStr);
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No hemos podido validar tu cuenta de Google. Inténtalo de nuevo.");
        }
        if (idToken == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No hemos podido validar tu cuenta de Google. Inténtalo de nuevo.");

        GoogleIdToken.Payload payload = idToken.getPayload();
        if (!Boolean.TRUE.equals(payload.getEmailVerified()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tu correo de Google no está verificado. Verifícalo en Google y vuelve a intentarlo.");
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
                // También aquí se crea una cuenta, así que también hay que
                // dejar constancia del consentimiento. El aviso de que al
                // continuar se aceptan los términos va junto al botón de Google.
                nuevo.setConsentimientoEn(java.time.Instant.now());
                nuevo.setConsentimientoVersion(POLITICA_VERSION);
                return nuevo;
            });
        u.setNombre(nombre);
        if (u.getGoogleSub() == null) u.setGoogleSub(sub); // vincula cuenta existente o fija la nueva
        u = usuarios.save(u);

        if (u.isBloqueado())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu cuenta está bloqueada. Escribe a gorkajesusquesadavegadev@gmail.com para recuperarla.");
        return new AuthResponse(jwt.generate(u.getId(), u.getRol().name()), u.getId(), u.getNombre(), u.getRol().name());
    }
}
