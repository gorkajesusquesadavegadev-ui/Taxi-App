package com.taya.service;
import com.taya.model.EstadoReserva;
import com.taya.model.Reserva;
import com.taya.repository.ReservaRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;

/**
 * Activa las reservas a su hora: cada minuto busca reservas ACEPTADAS cuya
 * hora ya llegó (ventana de 2 min de antelación) y aún sin viaje, y las
 * convierte en un viaje en curso. A partir de ahí el cliente ve el flujo
 * normal: "taxista en camino → ha llegado → en curso → completado".
 */
@Component
public class ReservaActivador {
    private final ReservaRepository reservas;
    private final ViajeService viajes;
    public ReservaActivador(ReservaRepository r, ViajeService v) { this.reservas = r; this.viajes = v; }

    @Scheduled(fixedDelay = 60000, initialDelay = 15000)
    @Transactional
    public void activar() {
        Instant limite = Instant.now().plus(Duration.ofMinutes(2)); // activa hasta 2 min antes
        for (Reserva r : reservas.findByEstadoAndProgramadaParaAfterOrderByProgramadaParaAsc(
                EstadoReserva.ACEPTADA, Instant.now().minus(Duration.ofHours(6)))) {
            if (r.getViajeId() != null) continue;
            if (r.getProgramadaPara().isAfter(limite)) continue; // aún no toca
            var viaje = viajes.activarDesdeReserva(r);
            r.setViajeId(viaje.getId());
            r.setEstado(EstadoReserva.COMPLETADA); // la reserva cumplió su función
            reservas.save(r);
        }
    }
}
