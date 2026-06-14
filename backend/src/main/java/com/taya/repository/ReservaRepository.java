package com.taya.repository;
import com.taya.model.EstadoReserva;
import com.taya.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByClienteIdOrderByProgramadaParaDesc(Long clienteId);
    List<Reserva> findByTaxistaIdOrderByProgramadaParaAsc(Long taxistaId);
    // disponibles para taxistas: pendientes y aún en el futuro
    List<Reserva> findByEstadoAndProgramadaParaAfterOrderByProgramadaParaAsc(EstadoReserva estado, Instant ahora);
    // pendientes cuya hora ya pasó (para caducar) o aceptadas a activar
    List<Reserva> findByEstado(EstadoReserva estado);
}
