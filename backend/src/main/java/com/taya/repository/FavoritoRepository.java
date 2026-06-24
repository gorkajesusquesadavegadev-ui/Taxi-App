package com.taya.repository;
import com.taya.model.Favorito;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FavoritoRepository extends JpaRepository<Favorito, Long> {
    List<Favorito> findByUsuarioIdOrderByCreadoEnAsc(Long usuarioId);
    long countByUsuarioId(Long usuarioId);
}
