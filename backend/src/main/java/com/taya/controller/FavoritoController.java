package com.taya.controller;
import com.taya.model.Favorito;
import com.taya.repository.FavoritoRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController @RequestMapping("/api/favoritos")
public class FavoritoController {
    private static final int MAX_POR_USUARIO = 12;
    private final FavoritoRepository favoritos;
    public FavoritoController(FavoritoRepository favoritos) { this.favoritos = favoritos; }

    public record FavoritoResponse(Long id, String etiqueta, String direccion, double lat, double lng) {}
    public record CrearFavoritoRequest(@NotBlank String etiqueta, String direccion, double lat, double lng) {}

    private FavoritoResponse aResponse(Favorito f) {
        return new FavoritoResponse(f.getId(), f.getEtiqueta(), f.getDireccion(), f.getLat(), f.getLng());
    }

    @GetMapping
    public List<FavoritoResponse> mios(@AuthenticationPrincipal String uid) {
        return favoritos.findByUsuarioIdOrderByCreadoEnAsc(Long.valueOf(uid)).stream().map(this::aResponse).toList();
    }

    @PostMapping
    @Transactional
    public FavoritoResponse crear(@AuthenticationPrincipal String uid, @RequestBody CrearFavoritoRequest r) {
        Long usuarioId = Long.valueOf(uid);
        if (favoritos.countByUsuarioId(usuarioId) >= MAX_POR_USUARIO)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Has alcanzado el máximo de favoritos");
        Favorito f = new Favorito();
        f.setUsuarioId(usuarioId);
        f.setEtiqueta(r.etiqueta().trim());
        f.setDireccion(r.direccion() != null ? r.direccion().trim() : null);
        f.setLat(r.lat()); f.setLng(r.lng());
        return aResponse(favoritos.save(f));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void borrar(@AuthenticationPrincipal String uid, @PathVariable Long id) {
        favoritos.findById(id).ifPresent(f -> {
            if (!f.getUsuarioId().equals(Long.valueOf(uid)))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no es tuyo");
            favoritos.delete(f);
        });
    }
}
