package com.taya.controller;
import com.taya.dto.request.CrearReservaRequest;
import com.taya.dto.response.ReservaResponse;
import com.taya.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/reservas")
public class ReservaController {
    private final ReservaService reservas;
    public ReservaController(ReservaService r) { this.reservas = r; }

    @PostMapping @PreAuthorize("hasRole('CLIENTE')")
    public ReservaResponse crear(@AuthenticationPrincipal String uid, @Valid @RequestBody CrearReservaRequest r) {
        return reservas.crear(Long.valueOf(uid), r);
    }

    @GetMapping("/mias") @PreAuthorize("hasRole('CLIENTE')")
    public List<ReservaResponse> mias(@AuthenticationPrincipal String uid) {
        return reservas.misCliente(Long.valueOf(uid));
    }

    @GetMapping("/disponibles") @PreAuthorize("hasRole('TAXISTA')")
    public List<ReservaResponse> disponibles() { return reservas.disponibles(); }

    @GetMapping("/taxista") @PreAuthorize("hasRole('TAXISTA')")
    public List<ReservaResponse> deTaxista(@AuthenticationPrincipal String uid) {
        return reservas.misTaxista(Long.valueOf(uid));
    }

    @PutMapping("/{id}/aceptar") @PreAuthorize("hasRole('TAXISTA')")
    public ReservaResponse aceptar(@AuthenticationPrincipal String uid, @PathVariable Long id) {
        return reservas.aceptar(id, Long.valueOf(uid));
    }

    @PutMapping("/{id}/cancelar")
    public ReservaResponse cancelar(@AuthenticationPrincipal String uid, @PathVariable Long id) {
        return reservas.cancelar(id, Long.valueOf(uid));
    }
}
