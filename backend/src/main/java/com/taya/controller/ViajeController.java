package com.taya.controller;
import com.taya.dto.request.*;
import com.taya.dto.response.*;
import com.taya.service.ViajeService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/viajes")
public class ViajeController {
    private final ViajeService viajes;
    public ViajeController(ViajeService viajes) { this.viajes = viajes; }

    @PostMapping("/estimar")
    public EstimacionResponse estimar(@Valid @RequestBody EstimarRequest r) { return viajes.estimar(r); }

    @PostMapping("/solicitar")
    @PreAuthorize("hasRole('CLIENTE')")
    public ViajeResponse solicitar(@AuthenticationPrincipal String uid, @Valid @RequestBody SolicitarViajeRequest r) {
        return viajes.solicitar(Long.valueOf(uid), r);
    }

    @PutMapping("/{id}/aceptar") @PreAuthorize("hasRole('TAXISTA')")
    public ViajeResponse aceptar(@AuthenticationPrincipal String uid, @PathVariable Long id) { return viajes.aceptar(id, Long.valueOf(uid)); }

    @PutMapping("/{id}/llegada") @PreAuthorize("hasRole('TAXISTA')")
    public ViajeResponse llegada(@AuthenticationPrincipal String uid, @PathVariable Long id) { return viajes.llegada(id, Long.valueOf(uid)); }

    @PutMapping("/{id}/iniciar") @PreAuthorize("hasRole('TAXISTA')")
    public ViajeResponse iniciar(@AuthenticationPrincipal String uid, @PathVariable Long id) { return viajes.iniciar(id, Long.valueOf(uid)); }

    @PutMapping("/{id}/finalizar") @PreAuthorize("hasRole('TAXISTA')")
    public ViajeResponse finalizar(@AuthenticationPrincipal String uid, @PathVariable Long id, @Valid @RequestBody FinalizarRequest r) {
        return viajes.finalizar(id, Long.valueOf(uid), r.distanciaReal());
    }

    @PutMapping("/{id}/cancelar")
    public ViajeResponse cancelar(@AuthenticationPrincipal String uid, @PathVariable Long id) { return viajes.cancelar(id, Long.valueOf(uid)); }

    @GetMapping("/historial")
    public List<ViajeResponse> historial(@AuthenticationPrincipal String uid) {
        return viajes.historialCliente(Long.valueOf(uid));
    }
}
