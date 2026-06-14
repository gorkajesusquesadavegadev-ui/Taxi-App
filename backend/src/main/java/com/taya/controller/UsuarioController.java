package com.taya.controller;
import com.taya.dto.response.UsuarioResponse;
import com.taya.model.Rol;
import com.taya.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    public UsuarioController(UsuarioRepository u, PasswordEncoder e) { this.usuarios = u; this.encoder = e; }

    /** Campos de vehículo solo se aplican a taxistas; en cliente se ignoran. */
    public record ActualizarMeRequest(@NotBlank @Size(min = 2, max = 60) String nombre,
                                      String vehiculoModelo, String vehiculoMatricula,
                                      String telefono) {}

    public record CambiarPasswordRequest(@NotBlank String actual,
                                         @NotBlank @Size(min = 6, max = 100) String nueva) {}

    private UsuarioResponse aResponse(com.taya.model.Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol().name(),
            u.getVehiculoMatricula(), u.getVehiculoModelo(), u.getTelefono());
    }

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal String userId) {
        return aResponse(usuarios.findById(Long.valueOf(userId)).orElseThrow());
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
}
