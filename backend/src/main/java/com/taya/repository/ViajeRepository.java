package com.taya.repository;
import com.taya.model.EstadoViaje;
import com.taya.model.Viaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ViajeRepository extends JpaRepository<Viaje, Long> {
    List<Viaje> findByClienteIdOrderBySolicitadoEnDesc(Long clienteId);
    List<Viaje> findByTaxistaIdOrderBySolicitadoEnDesc(Long taxistaId);

    // Demand analysis: every pickup requested in the recent window.
    List<Viaje> findBySolicitadoEnAfter(Instant desde);

    // Admin dashboard.
    long countByEstado(EstadoViaje estado);
    List<Viaje> findTop100ByOrderBySolicitadoEnDesc();

    // Compartir viaje en vivo (token público).
    Optional<Viaje> findByShareToken(String shareToken);

    // Fidelidad: viajes completados por cliente.
    long countByClienteIdAndEstado(Long clienteId, EstadoViaje estado);

    // Current non-terminal trip for resync ("always informed" client polling).
    Optional<Viaje> findFirstByClienteIdAndEstadoInOrderBySolicitadoEnDesc(
        Long clienteId, Collection<EstadoViaje> estados);

    // Active trip assigned to a taxista (e.g. an activated reservation).
    Optional<Viaje> findFirstByTaxistaIdAndEstadoInOrderBySolicitadoEnDesc(
        Long taxistaId, Collection<EstadoViaje> estados);

    // Último viaje terminado del cliente, para poder valorarlo aunque haya
    // cerrado la app: /activo solo devuelve estados no terminales, así que sin
    // esto un viaje completado quedaba fuera de alcance al recargar y ya no se
    // podía valorar nunca.
    Optional<Viaje> findFirstByClienteIdAndEstadoAndCompletadoEnAfterOrderByCompletadoEnDesc(
        Long clienteId, EstadoViaje estado, java.time.Instant desde);

    // Retry dispatcher: trips stuck as SOLICITADO beyond cutoff (no driver accepted yet)
    List<Viaje> findByEstadoAndSolicitadoEnBefore(EstadoViaje estado, Instant antes);

    // First-accept-wins: only succeeds while still SOLICITADO
    @Modifying
    @Query("update Viaje v set v.estado = com.taya.model.EstadoViaje.ACEPTADO, " +
           "v.taxistaId = :taxistaId, v.aceptadoEn = :ahora " +
           "where v.id = :viajeId and v.estado = com.taya.model.EstadoViaje.SOLICITADO")
    int aceptarSiDisponible(@Param("viajeId") Long viajeId, @Param("taxistaId") Long taxistaId,
                            @Param("ahora") Instant ahora);
}
