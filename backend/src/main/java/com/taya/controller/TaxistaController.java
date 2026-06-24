package com.taya.controller;
import com.taya.dto.response.ViajeResponse;
import com.taya.repository.UsuarioRepository;
import com.taya.service.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/taxista")
public class TaxistaController {
    private final UbicacionService ubicacion;
    private final TarifaService tarifa;
    private final ViajeService viajes;
    private final UsuarioRepository usuarios;
    public TaxistaController(UbicacionService u, TarifaService t, ViajeService v, UsuarioRepository usuarios) {
        this.ubicacion=u; this.tarifa=t; this.viajes=v; this.usuarios=usuarios;
    }

    public record EstadoRequest(String estado, Double lat, Double lng) {}

    @PutMapping("/estado")
    @Transactional
    public void estado(@AuthenticationPrincipal String uid, @RequestBody EstadoRequest r) {
        Long id = Long.valueOf(uid);
        boolean libre = "LIBRE".equals(r.estado());
        if (libre) ubicacion.setLibre(id, r.lat(), r.lng());
        else ubicacion.setDesconectado(id);
        // Disponibilidad persistente para PUSH (no caduca al cerrar la app).
        // 'Desconectar' explícito = no disponible; conectar = disponible + posición.
        usuarios.findById(id).ifPresent(u -> {
            u.setDisponible(libre);
            if (libre && r.lat() != null && r.lng() != null) {
                u.setUltimaLat(r.lat()); u.setUltimaLng(r.lng());
            }
            usuarios.save(u);
        });
    }

    @GetMapping("/historial")
    public List<ViajeResponse> historial(@AuthenticationPrincipal String uid) { return viajes.historialTaxista(Long.valueOf(uid)); }
}
