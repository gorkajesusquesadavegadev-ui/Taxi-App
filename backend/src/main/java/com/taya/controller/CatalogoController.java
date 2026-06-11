package com.taya.controller;
import com.taya.service.CatalogoService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/catalogo")
public class CatalogoController {
    private final CatalogoService catalogo;
    public CatalogoController(CatalogoService c) { this.catalogo = c; }

    @GetMapping
    public Map<String, Object> catalogo() {
        return Map.of("transfers", catalogo.transfers(), "excursiones", catalogo.excursiones());
    }
}
