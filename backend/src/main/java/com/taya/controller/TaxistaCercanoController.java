package com.taya.controller;
import com.taya.service.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/taxistas")
public class TaxistaCercanoController {
    private final UbicacionService ubicacion; private final TarifaService tarifa;
    public TaxistaCercanoController(UbicacionService u, TarifaService t) { this.ubicacion=u; this.tarifa=t; }

    @GetMapping("/cercanos")
    public List<UbicacionService.TaxiCercano> cercanos(@RequestParam double lat, @RequestParam double lng,
        @RequestParam(required = false) Double radio) {
        double r = radio != null ? radio : tarifa.radioBusquedaKm().doubleValue();
        return ubicacion.libresEnRadio(lat, lng, r);
    }

    /** Todos los taxistas online (libres + en viaje) en un radio amplio. */
    @GetMapping("/online")
    public List<UbicacionService.TaxiOnline> online(
        @RequestParam double lat, @RequestParam double lng,
        @RequestParam(required = false, defaultValue = "60") double radio) {
        return ubicacion.todosOnline(lat, lng, radio);
    }
}
