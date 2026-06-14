package com.taya.controller;
import com.taya.service.TarifaService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/tarifa")
public class TarifaController {
    private final TarifaService tarifa;
    public TarifaController(TarifaService t) { this.tarifa = t; }

    /** Tarifa vigente en este momento (franja, bandera y €/km por zona). */
    @GetMapping("/actual")
    public Map<String, Object> actual() { return tarifa.infoActual(); }
}
