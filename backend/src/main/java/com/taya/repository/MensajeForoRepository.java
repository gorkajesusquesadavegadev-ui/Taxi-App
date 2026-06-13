package com.taya.repository;
import com.taya.model.MensajeForo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MensajeForoRepository extends JpaRepository<MensajeForo, Long> {
    /** Últimos 100 mensajes (más recientes primero); el frontend los invierte. */
    List<MensajeForo> findTop100ByOrderByCreadoEnDesc();
}
