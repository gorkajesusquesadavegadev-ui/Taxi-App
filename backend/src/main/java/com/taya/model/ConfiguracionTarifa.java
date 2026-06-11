package com.taya.model;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "configuracion_tarifa")
public class ConfiguracionTarifa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "bajada_bandera", nullable = false) private BigDecimal bajadaBandera;
    @Column(name = "precio_km", nullable = false) private BigDecimal precioKm;
    @Column(name = "radio_busqueda_km", nullable = false) private BigDecimal radioBusquedaKm;
    // nullable: columnas añadidas sobre BD ya poblada; el servicio aplica defaults si faltan
    @Column(name = "carrera_minima") private BigDecimal carreraMinima;
    @Column(name = "recargo_nocturno_pct") private BigDecimal recargoNocturnoPct;
    public Long getId(){ return id; } public void setId(Long v){ this.id=v; }
    public BigDecimal getBajadaBandera(){ return bajadaBandera; } public void setBajadaBandera(BigDecimal v){ this.bajadaBandera=v; }
    public BigDecimal getPrecioKm(){ return precioKm; } public void setPrecioKm(BigDecimal v){ this.precioKm=v; }
    public BigDecimal getRadioBusquedaKm(){ return radioBusquedaKm; } public void setRadioBusquedaKm(BigDecimal v){ this.radioBusquedaKm=v; }
    public BigDecimal getCarreraMinima(){ return carreraMinima; } public void setCarreraMinima(BigDecimal v){ this.carreraMinima=v; }
    public BigDecimal getRecargoNocturnoPct(){ return recargoNocturnoPct; } public void setRecargoNocturnoPct(BigDecimal v){ this.recargoNocturnoPct=v; }
}
