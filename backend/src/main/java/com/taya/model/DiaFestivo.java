package com.taya.model;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Día festivo con tarifa de festivo (3,65 € / 0,85 €). Se siembran solos los
 * nacionales + autonómicos de Canarias (fijos y Semana Santa) de cada año; los
 * festivos locales de Las Palmas pueden añadirse a mano en la tabla.
 */
@Entity @Table(name = "dias_festivos")
public class DiaFestivo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private LocalDate fecha;
    @Column(nullable = false) private String nombre;

    public DiaFestivo() {}
    public DiaFestivo(LocalDate fecha, String nombre) { this.fecha = fecha; this.nombre = nombre; }
    public Long getId(){ return id; } public void setId(Long v){ this.id=v; }
    public LocalDate getFecha(){ return fecha; } public void setFecha(LocalDate v){ this.fecha=v; }
    public String getNombre(){ return nombre; } public void setNombre(String v){ this.nombre=v; }
}
