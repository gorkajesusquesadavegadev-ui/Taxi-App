package com.taya.controller;
import com.taya.dto.response.UsuarioResponse;
import com.taya.repository.UsuarioRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioRepository usuarios;
    public UsuarioController(UsuarioRepository u) { this.usuarios = u; }

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal String userId) {
        var u = usuarios.findById(Long.valueOf(userId)).orElseThrow();
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol().name(),
            u.getVehiculoMatricula(), u.getVehiculoModelo());
    }
}
