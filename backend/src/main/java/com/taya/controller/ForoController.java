package com.taya.controller;
import com.taya.dto.response.MensajeForoResponse;
import com.taya.service.ForoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/foro")
@PreAuthorize("hasRole('TAXISTA')")
public class ForoController {
    private final ForoService foro;
    public ForoController(ForoService f) { this.foro = f; }

    public record PublicarRequest(@NotBlank @Size(max = 1000) String texto) {}

    @GetMapping
    public List<MensajeForoResponse> historial() { return foro.historial(); }

    @PostMapping
    public MensajeForoResponse publicar(@AuthenticationPrincipal String uid, @Valid @RequestBody PublicarRequest r) {
        return foro.publicar(Long.valueOf(uid), r.texto());
    }
}
