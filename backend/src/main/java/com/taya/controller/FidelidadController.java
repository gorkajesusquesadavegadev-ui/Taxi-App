package com.taya.controller;
import com.taya.model.EstadoViaje;
import com.taya.repository.ViajeRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Programa de fidelidad del cliente: nivel + viaje gratis cada 10 completados. */
@RestController @RequestMapping("/api/fidelidad")
public class FidelidadController {
    private static final int VIAJES_POR_RECOMPENSA = 10;
    private final ViajeRepository viajes;
    public FidelidadController(ViajeRepository viajes) { this.viajes = viajes; }

    public record FidelidadResponse(long completados, String nivel, int progreso,
        int faltanParaRecompensa, long recompensasGanadas) {}

    private String nivel(long c) {
        if (c >= 30) return "Oro";
        if (c >= 10) return "Plata";
        return "Bronce";
    }

    @GetMapping
    @PreAuthorize("hasRole('CLIENTE')")
    public FidelidadResponse mia(@AuthenticationPrincipal String uid) {
        long c = viajes.countByClienteIdAndEstado(Long.valueOf(uid), EstadoViaje.COMPLETADO);
        int enCiclo = (int) (c % VIAJES_POR_RECOMPENSA);
        int faltan = enCiclo == 0 && c > 0 ? 0 : VIAJES_POR_RECOMPENSA - enCiclo;
        return new FidelidadResponse(c, nivel(c), enCiclo, faltan, c / VIAJES_POR_RECOMPENSA);
    }
}
