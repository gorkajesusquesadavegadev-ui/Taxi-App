package com.taya.service;

import com.taya.model.EstadoViaje;
import com.taya.model.Viaje;
import com.taya.repository.ViajeRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Re-broadcasts SOLICITADO trips that haven't been accepted yet.
 * Covers: WS drop between dispatch and taxista receiving, cold starts,
 * all-drivers-busy edge cases.
 *
 * Timeline:
 *   T+0s   → solicitar() → first dispatch (normal radius)
 *   T+20s  → retry 1 (same radius, catches missed WS)
 *   T+50s  → retry 2 (MatchingService already widens to 50 km automatically)
 *   T+5min → give up (client can cancel or retry manually)
 */
@Component
public class TripRetryScheduler {

    private final ViajeRepository repo;
    private final MatchingService matching;

    public TripRetryScheduler(ViajeRepository repo, MatchingService matching) {
        this.repo = repo;
        this.matching = matching;
    }

    @Scheduled(fixedDelay = 20_000, initialDelay = 30_000)
    public void rebroadcastUnmatched() {
        Instant cutoff = Instant.now().minusSeconds(20);
        Instant tooOld  = Instant.now().minusSeconds(300); // give up after 5 min

        List<Viaje> pending = repo.findByEstadoAndSolicitadoEnBefore(EstadoViaje.SOLICITADO, cutoff);
        for (Viaje v : pending) {
            if (v.getSolicitadoEn().isBefore(tooOld)) continue; // expired, client will cancel
            matching.difundirNuevoViaje(v);
        }
    }
}
