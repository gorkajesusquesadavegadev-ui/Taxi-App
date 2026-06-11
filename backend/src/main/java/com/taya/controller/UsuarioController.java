package com.taya.controller;
import com.taya.dto.response.UsuarioResponse;
import com.taya.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioRepository usuarios;
    public UsuarioController(UsuarioRepository u) { this.usuarios = u; }

    public record ActualizarMeRequest(@NotBlank @Size(min = 2, max = 60) String nombre) {}

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal String userId) {
        var u = usuarios.findById(Long.valueOf(userId)).orElseThrow();
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol().name(),
            u.getVehiculoMatricula(), u.getVehiculoModelo());
    }

    @PutMapping("/me")
    public UsuarioResponse actualizar(@AuthenticationPrincipal String userId,
                                      @Valid @RequestBody ActualizarMeRequest r) {
        var u = usuarios.findById(Long.valueOf(userId)).orElseThrow();
        u.setNombre(r.nombre().trim());
        usuarios.save(u);
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol().name(),
            u.getVehiculoMatricula(), u.getVehiculoModelo());
    }
}
