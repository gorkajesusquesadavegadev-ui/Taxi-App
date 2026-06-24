package com.taya.controller;
import com.taya.service.AdminService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService admin;
    public AdminController(AdminService admin) { this.admin = admin; }

    @GetMapping("/metricas")
    public AdminService.Metricas metricas() { return admin.metricas(); }

    @GetMapping("/usuarios")
    public List<AdminService.UsuarioAdmin> usuarios() { return admin.usuarios(); }

    @GetMapping("/taxistas/pendientes")
    public List<AdminService.UsuarioAdmin> pendientes() { return admin.taxistasPendientes(); }

    @PutMapping("/taxistas/{id}/verificar")
    public void verificar(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean valor) {
        admin.verificar(id, valor);
    }

    @PutMapping("/usuarios/{id}/bloquear")
    public void bloquear(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean valor) {
        admin.bloquear(id, valor);
    }

    @GetMapping("/viajes")
    public List<AdminService.ViajeAdmin> viajes() { return admin.viajesRecientes(); }
}
