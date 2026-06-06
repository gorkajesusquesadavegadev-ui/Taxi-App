package com.taya.repository;
import com.taya.model.Viaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ViajeRepository extends JpaRepository<Viaje, Long> {
    List<Viaje> findByClienteIdOrderBySolicitadoEnDesc(Long clienteId);
    List<Viaje> findByTaxistaIdOrderBySolicitadoEnDesc(Long taxistaId);

    // First-accept-wins: only succeeds while still SOLICITADO
    @Modifying
    @Query("update Viaje v set v.estado = com.taya.model.EstadoViaje.ACEPTADO, " +
           "v.taxistaId = :taxistaId, v.aceptadoEn = CURRENT_TIMESTAMP " +
           "where v.id = :viajeId and v.estado = com.taya.model.EstadoViaje.SOLICITADO")
    int aceptarSiDisponible(@Param("viajeId") Long viajeId, @Param("taxistaId") Long taxistaId);
}
