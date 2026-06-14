package com.taya.repository;
import com.taya.model.DiaFestivo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;

public interface DiaFestivoRepository extends JpaRepository<DiaFestivo, Long> {
    boolean existsByFecha(LocalDate fecha);
    boolean existsByFechaBetween(LocalDate desde, LocalDate hasta);
}
