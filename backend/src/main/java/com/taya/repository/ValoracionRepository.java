package com.taya.repository;
import com.taya.model.Valoracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ValoracionRepository extends JpaRepository<Valoracion, Long> {
    boolean existsByViajeIdAndAutorId(Long viajeId, Long autorId);
    List<Valoracion> findByDestinatarioIdOrderByCreadoEnDesc(Long destinatarioId);
    List<Valoracion> findByAutorId(Long autorId);

    @Query("select coalesce(avg(v.estrellas), 0) from Valoracion v where v.destinatarioId = :uid")
    double mediaDe(@Param("uid") Long uid);

    @Query("select count(v) from Valoracion v where v.destinatarioId = :uid")
    long countDe(@Param("uid") Long uid);
}
