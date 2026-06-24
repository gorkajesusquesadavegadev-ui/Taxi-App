package com.taya.controller;
import com.taya.service.ValoracionService;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/valoraciones")
public class ValoracionController {
    private final ValoracionService valoraciones;
    public ValoracionController(ValoracionService valoraciones) { this.valoraciones = valoraciones; }

    public record ValorarRequest(@Min(1) @Max(5) int estrellas, String comentario) {}

    @PostMapping("/{viajeId}")
    public void valorar(@AuthenticationPrincipal String uid, @PathVariable Long viajeId,
                        @RequestBody ValorarRequest r) {
        valoraciones.valorar(viajeId, Long.valueOf(uid), r.estrellas(), r.comentario());
    }

    @GetMapping("/pendiente/{viajeId}")
    public boolean pendiente(@AuthenticationPrincipal String uid, @PathVariable Long viajeId) {
        return valoraciones.pendienteDeValorar(viajeId, Long.valueOf(uid));
    }
}
