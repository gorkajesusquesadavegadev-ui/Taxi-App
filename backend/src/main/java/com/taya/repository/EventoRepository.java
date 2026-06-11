package com.taya.repository;
import com.taya.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {
    /** Eventos aún no terminados que empiezan antes del horizonte dado. */
    List<Evento> findByFinAfterAndInicioBefore(Instant ahora, Instant horizonte);
}
