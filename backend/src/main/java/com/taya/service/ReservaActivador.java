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
    private final ReservaService reservaService;
    private final WebPushService push;
    public ReservaActivador(ReservaRepository r, ViajeService v, ReservaService rs, WebPushService push) {
        this.reservas = r; this.viajes = v; this.reservaService = rs; this.push = push;
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 15000)
    @Transactional
    public void activar() {
        Instant ahora = Instant.now();
        Instant limite = ahora.plus(Duration.ofMinutes(2)); // activa hasta 2 min antes
        Instant ventana30 = ahora.plus(Duration.ofMinutes(30));
        // 1) aceptadas que ya tocan -> viaje en curso
        for (Reserva r : reservas.findByEstado(EstadoReserva.ACEPTADA)) {
            // Recordatorio push 30 min antes (una sola vez), a cliente y taxista.
            if (!r.isRecordatorioEnviado() && r.getViajeId() == null
                && r.getProgramadaPara().isAfter(ahora) && r.getProgramadaPara().isBefore(ventana30)) {
                String detalle = r.getDetalle() != null ? r.getDetalle() : (r.getOrigenTexto() != null ? r.getOrigenTexto() : "tu reserva");
                push.enviar(r.getClienteId(), "⏰ Tu reserva es pronto", "En ~30 min: " + detalle, "/reservas", "reserva");
                if (r.getTaxistaId() != null)
                    push.enviar(r.getTaxistaId(), "⏰ Reserva en ~30 min", detalle, "/reservas", "reserva");
                r.setRecordatorioEnviado(true);
                reservas.save(r);
            }
            if (r.getViajeId() != null) continue;
            if (r.getProgramadaPara().isAfter(limite)) continue;
            var viaje = viajes.activarDesdeReserva(r);
            r.setViajeId(viaje.getId());
            r.setEstado(EstadoReserva.COMPLETADA); // la reserva cumplió su función
            reservas.save(r);
        }
        // 2) pendientes cuya hora pasó sin que nadie las acepte -> caducan
        for (Reserva r : reservas.findByEstado(EstadoReserva.PENDIENTE)) {
            if (r.getProgramadaPara().isBefore(ahora)) reservaService.caducar(r);
        }
    }
}
