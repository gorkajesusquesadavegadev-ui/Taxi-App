package com.taya.controller;
import com.taya.dto.response.ViajeResponse;
import com.taya.service.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/taxista")
public class TaxistaController {
    private final UbicacionService ubicacion;
    private final TarifaService tarifa;
    private final ViajeService viajes;
    public TaxistaController(UbicacionService u, TarifaService t, ViajeService v) { this.ubicacion=u; this.tarifa=t; this.viajes=v; }

    public record EstadoRequest(String estado, Double lat, Double lng) {}

    @PutMapping("/estado")
    public void estado(@AuthenticationPrincipal String uid, @RequestBody EstadoRequest r) {
        Long id = Long.valueOf(uid);
        if ("LIBRE".equals(r.estado())) ubicacion.setLibre(id, r.lat(), r.lng());
        else ubicacion.setDesconectado(id);
    }

    @GetMapping("/historial")
    public List<ViajeResponse> historial(@AuthenticationPrincipal String uid) { return viajes.historialTaxista(Long.valueOf(uid)); }
}
