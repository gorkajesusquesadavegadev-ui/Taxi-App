package com.taya.controller;
import com.taya.dto.response.UsuarioResponse;
import com.taya.model.EstadoReserva;
import com.taya.model.Rol;
import com.taya.repository.*;
import com.taya.security.JwtTokenProvider;
import com.taya.security.TokenBlacklist;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final ViajeRepository viajes;
    private final ReservaRepository reservas;
    private final FavoritoRepository favoritos;
    private final ValoracionRepository valoraciones;
    private final MensajeForoRepository mensajesForo;
    private final PushSubscriptionRepository pushSubs;
    private final JwtTokenProvider jwt;
    private final TokenBlacklist blacklist;

    public UsuarioController(UsuarioRepository u, PasswordEncoder e, ViajeRepository viajes,
                             ReservaRepository reservas, FavoritoRepository favoritos,
                             ValoracionRepository valoraciones, MensajeForoRepository mensajesForo,
                             PushSubscriptionRepository pushSubs, JwtTokenProvider jwt, TokenBlacklist blacklist) {
        this.usuarios = u; this.encoder = e; this.viajes = viajes; this.reservas = reservas;
        this.favoritos = favoritos; this.valoraciones = valoraciones; this.mensajesForo = mensajesForo;
        this.pushSubs = pushSubs; this.jwt = jwt; this.blacklist = blacklist;
    }

    /** Campos de vehículo solo se aplican a taxistas; en cliente se ignoran. */
    // Mismos límites que en el alta: sin ellos un campo largo llegaba a la
    // columna de la base de datos y el error resultante devolvía al usuario la
    // sentencia INSERT entera de Hibernate. Y los mensajes van escritos, que si
    // no Bean Validation responde en inglés y eso es lo que se ve en pantalla.
    public record ActualizarMeRequest(
        @NotBlank(message = "Escribe tu nombre")
        @Size(min = 2, max = 60, message = "El nombre debe tener entre 2 y 60 caracteres") String nombre,
        @Size(max = 60, message = "El modelo del vehículo es demasiado largo") String vehiculoModelo,
        @Size(max = 15, message = "La matrícula es demasiado larga") String vehiculoMatricula,
        @Size(max = 20, message = "El teléfono es demasiado largo") String telefono,
        Boolean vehiculoAccesible) {}

    public record CambiarPasswordRequest(
        @NotBlank(message = "Escribe tu contraseña actual") String actual,
        @NotBlank(message = "Escribe la contraseña nueva")
        // 72 bytes es el máximo real de bcrypt; más allá recorta sin avisar.
        @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres") String nueva) {}

    /** RGPD art. 17: confirmación de contraseña obligatoria — evita que una sesión
     *  robada/olvidada en un dispositivo borre la cuenta sin el consentimiento real. */
    public record EliminarCuentaRequest(
        @NotBlank(message = "Escribe tu contraseña para confirmar") String password) {}

    private UsuarioResponse aResponse(com.taya.model.Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol().name(),
            u.getVehiculoMatricula(), u.getVehiculoModelo(), u.getTelefono(),
            u.isVerificado(), u.getRatingMedia(), u.getRatingCount(), u.getLicencia(),
            u.isVehiculoAccesible(), u.getConsentimientoEn() == null);
    }

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal String userId) {
        return aResponse(usuarios.findById(Long.valueOf(userId)).orElseThrow());
    }

    /**
     * Acepta la politica de privacidad desde la propia app. Existe para las
     * cuentas creadas antes de que hubiera casilla en el registro: sin esto,
     * de esos usuarios no habria constancia del consentimiento (art. 7.1) y la
     * unica alternativa limpia habria sido borrarles la cuenta.
     */
    @PostMapping("/me/consentimiento")
    public UsuarioResponse aceptarConsentimiento(@AuthenticationPrincipal String userId) {
        var u = usuarios.findById(Long.valueOf(userId)).orElseThrow();
        if (u.getConsentimientoEn() == null) {
            u.setConsentimientoEn(java.time.Instant.now());
            u.setConsentimientoVersion(com.taya.service.AuthService.POLITICA_VERSION);
            usuarios.save(u);
        }
        return aResponse(u);
    }

    @PutMapping("/me")
    public UsuarioResponse actualizar(@AuthenticationPrincipal String userId,
                                      @Valid @RequestBody ActualizarMeRequest r) {
        var u = usuarios.findById(Long.valueOf(userId)).orElseThrow();
        u.setNombre(r.nombre().trim());
        if (r.telefono() != null) u.setTelefono(r.telefono().isBlank() ? null : r.telefono().trim());
        if (u.getRol() == Rol.TAXISTA) {
            if (r.vehiculoModelo() != null && !r.vehiculoModelo().isBlank())
                u.setVehiculoModelo(r.vehiculoModelo().trim());
            if (r.vehiculoMatricula() != null && !r.vehiculoMatricula().isBlank())
                u.setVehiculoMatricula(r.vehiculoMatricula().trim().toUpperCase());
            if (r.vehiculoAccesible() != null) u.setVehiculoAccesible(r.vehiculoAccesible());
        }
        usuarios.save(u);
        return aResponse(u);
    }

    @PutMapping("/me/password")
    public void cambiarPassword(@AuthenticationPrincipal String userId,
                                @Valid @RequestBody CambiarPasswordRequest r) {
        var u = usuarios.findById(Long.valueOf(userId)).orElseThrow();
        if (!encoder.matches(r.actual(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta");
        u.setPasswordHash(encoder.encode(r.nueva()));
        usuarios.save(u);
    }

    /**
     * Derecho de acceso y portabilidad (RGPD art. 15 y 20): descarga en JSON de
     * todos los datos personales que guardamos de este usuario. No incluye la
     * contraseña (hash) ni datos de terceros (solo nombre/matrícula del otro
     * lado de cada viaje, igual que ya se ve en el historial de la app).
     */
    @GetMapping("/me/exportar")
    public Map<String, Object> exportar(@AuthenticationPrincipal String userId) {
        Long id = Long.valueOf(userId);
        var u = usuarios.findById(id).orElseThrow();
        var misViajes = u.getRol() == Rol.TAXISTA
            ? viajes.findByTaxistaIdOrderBySolicitadoEnDesc(id)
            : viajes.findByClienteIdOrderBySolicitadoEnDesc(id);
        var misReservas = u.getRol() == Rol.TAXISTA
            ? reservas.findByTaxistaIdOrderByProgramadaParaAsc(id)
            : reservas.findByClienteIdOrderByProgramadaParaDesc(id);

        return Map.of(
            "exportadoEn", Instant.now().toString(),
            "perfil", Map.of(
                "nombre", u.getNombre(), "email", u.getEmail(), "rol", u.getRol().name(),
                "telefono", u.getTelefono() == null ? "" : u.getTelefono(),
                "licencia", u.getLicencia() == null ? "" : u.getLicencia(),
                "vehiculoMatricula", u.getVehiculoMatricula() == null ? "" : u.getVehiculoMatricula(),
                "vehiculoModelo", u.getVehiculoModelo() == null ? "" : u.getVehiculoModelo(),
                "creadoEn", u.getCreadoEn().toString(),
                "ratingMedia", u.getRatingMedia(), "ratingCount", u.getRatingCount()
            ),
            "viajes", misViajes,
            "reservas", misReservas,
            "favoritos", favoritos.findByUsuarioIdOrderByCreadoEnAsc(id),
            "valoracionesRecibidas", valoraciones.findByDestinatarioIdOrderByCreadoEnDesc(id),
            "valoracionesEmitidas", valoraciones.findByAutorId(id),
            "mensajesForo", mensajesForo.findByAutorId(id)
        );
    }

    /**
     * Derecho de supresión (RGPD art. 17). Los viajes NO se borran, pero el
     * motivo NO es una obligación fiscal —el operador no realiza actividad
     * económica y no la tiene—: es que un viaje implica a DOS personas, y el
     * registro forma parte también del historial del conductor, que tiene
     * interés legítimo en conservarlo (art. 6.1.f). Al anonimizar el perfil,
     * todo lo que identificaba a este usuario en esos viajes (nombre, teléfono,
     * correo) desaparece, así que el registro deja de ser un dato personal
     * suyo. Todo lo demás que sí es puramente personal se borra de verdad.
     */
    @DeleteMapping("/me")
    @Transactional
    public void eliminarCuenta(@AuthenticationPrincipal String userId, HttpServletRequest req,
                               @Valid @RequestBody EliminarCuentaRequest r) {
        Long id = Long.valueOf(userId);
        var u = usuarios.findById(id).orElseThrow();
        if (!encoder.matches(r.password(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña no es correcta");

        // 1) Borrado real de datos puramente personales sin obligación de retención
        pushSubs.deleteAll(pushSubs.findByUsuarioId(id));
        favoritos.deleteAll(favoritos.findByUsuarioIdOrderByCreadoEnAsc(id));

        // 2) Reservas futuras/pendientes: canceladas (no dejar huecos activos);
        //    notas (pueden llevar texto libre con datos personales) se borran siempre.
        var misReservasCliente = reservas.findByClienteIdOrderByProgramadaParaDesc(id);
        for (var res : misReservasCliente) {
            res.setNotas(null);
            if (res.getEstado() == EstadoReserva.PENDIENTE || res.getEstado() == EstadoReserva.ACEPTADA)
                res.setEstado(EstadoReserva.CANCELADA);
        }
        reservas.saveAll(misReservasCliente);
        var misReservasTaxista = reservas.findByTaxistaIdOrderByProgramadaParaAsc(id);
        for (var res : misReservasTaxista) res.setNotas(null);
        reservas.saveAll(misReservasTaxista);

        // 3) Foro: el mensaje deja de estar vinculado a una persona identificable.
        var misMensajes = mensajesForo.findByAutorId(id);
        for (var m : misMensajes) m.setAutorNombre("Usuario eliminado");
        mensajesForo.saveAll(misMensajes);

        // 4) Perfil: anonimizado por completo. El email se libera (único) para que
        //    la persona pueda registrarse de nuevo si quiere en el futuro.
        u.setNombre("Usuario eliminado");
        u.setEmail("eliminado-" + UUID.randomUUID() + "@canarycab.invalid");
        u.setPasswordHash(encoder.encode(UUID.randomUUID().toString())); // hash inutilizable, ningún login posible
        u.setTelefono(null);
        u.setLicencia(null);
        u.setVehiculoMatricula(null);
        u.setVehiculoModelo(null);
        u.setDocumentoUrl(null);
        u.setUltimaLat(null);
        u.setUltimaLng(null);
        u.setDisponible(false);
        u.setBloqueado(true); // cinturón y tirantes: ni con hash filtrado se podría operar
        usuarios.save(u);

        // 5) Revocar el token de esta sesión al instante (logout forzado).
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try { blacklist.revocar(jwt.getJti(token), jwt.secondsToExpiry(token)); } catch (Exception ignored) {}
        }
    }
}
