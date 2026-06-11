package com.taya.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "viajes")
public class Viaje {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "cliente_id", nullable = false) private Long clienteId;
    @Column(name = "taxista_id") private Long taxistaId;
    @Column(name = "origen_lat", nullable = false) private double origenLat;
    @Column(name = "origen_lng", nullable = false) private double origenLng;
    @Column(name = "destino_lat", nullable = false) private double destinoLat;
    @Column(name = "destino_lng", nullable = false) private double destinoLng;
    @Column(name = "origen_texto") private String origenTexto;
    @Column(name = "destino_texto") private String destinoTexto;
    @Column(name = "distancia_estimada_km") private BigDecimal distanciaEstimadaKm;
    @Column(name = "precio_estimado") private BigDecimal precioEstimado;
    @Column(name = "distancia_real_km") private BigDecimal distanciaRealKm;
    @Column(name = "precio_final") private BigDecimal precioFinal;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private EstadoViaje estado = EstadoViaje.SOLICITADO;
    // nullable en BD por filas antiguas; null se interpreta como NORMAL
    @Enumerated(EnumType.STRING) @Column(name = "tipo") private TipoViaje tipo = TipoViaje.NORMAL;
    @Column(name = "detalle") private String detalle;
    @Column(name = "oferta_id") private String ofertaId; // catálogo: permite reconstruir paradas
    @Column(name = "solicitado_en") private Instant solicitadoEn = Instant.now();
    @Column(name = "aceptado_en") private Instant aceptadoEn;
    @Column(name = "llegada_en") private Instant llegadaEn;
    @Column(name = "iniciado_en") private Instant iniciadoEn;
    @Column(name = "completado_en") private Instant completadoEn;
    @Column(name = "cancelado_en") private Instant canceladoEn;

    public Long getId() { return id; } public void setId(Long v){ this.id=v; }
    public Long getClienteId(){ return clienteId; } public void setClienteId(Long v){ this.clienteId=v; }
    public Long getTaxistaId(){ return taxistaId; } public void setTaxistaId(Long v){ this.taxistaId=v; }
    public double getOrigenLat(){ return origenLat; } public void setOrigenLat(double v){ this.origenLat=v; }
    public double getOrigenLng(){ return origenLng; } public void setOrigenLng(double v){ this.origenLng=v; }
    public double getDestinoLat(){ return destinoLat; } public void setDestinoLat(double v){ this.destinoLat=v; }
    public double getDestinoLng(){ return destinoLng; } public void setDestinoLng(double v){ this.destinoLng=v; }
    public String getOrigenTexto(){ return origenTexto; } public void setOrigenTexto(String v){ this.origenTexto=v; }
    public String getDestinoTexto(){ return destinoTexto; } public void setDestinoTexto(String v){ this.destinoTexto=v; }
    public BigDecimal getDistanciaEstimadaKm(){ return distanciaEstimadaKm; } public void setDistanciaEstimadaKm(BigDecimal v){ this.distanciaEstimadaKm=v; }
    public BigDecimal getPrecioEstimado(){ return precioEstimado; } public void setPrecioEstimado(BigDecimal v){ this.precioEstimado=v; }
    public BigDecimal getDistanciaRealKm(){ return distanciaRealKm; } public void setDistanciaRealKm(BigDecimal v){ this.distanciaRealKm=v; }
    public BigDecimal getPrecioFinal(){ return precioFinal; } public void setPrecioFinal(BigDecimal v){ this.precioFinal=v; }
    public EstadoViaje getEstado(){ return estado; } public void setEstado(EstadoViaje v){ this.estado=v; }
    public TipoViaje getTipo(){ return tipo; } public void setTipo(TipoViaje v){ this.tipo=v; }
    public String getDetalle(){ return detalle; } public void setDetalle(String v){ this.detalle=v; }
    public String getOfertaId(){ return ofertaId; } public void setOfertaId(String v){ this.ofertaId=v; }
    public Instant getSolicitadoEn(){ return solicitadoEn; } public void setSolicitadoEn(Instant v){ this.solicitadoEn=v; }
    public Instant getAceptadoEn(){ return aceptadoEn; } public void setAceptadoEn(Instant v){ this.aceptadoEn=v; }
    public Instant getLlegadaEn(){ return llegadaEn; } public void setLlegadaEn(Instant v){ this.llegadaEn=v; }
    public Instant getIniciadoEn(){ return iniciadoEn; } public void setIniciadoEn(Instant v){ this.iniciadoEn=v; }
    public Instant getCompletadoEn(){ return completadoEn; } public void setCompletadoEn(Instant v){ this.completadoEn=v; }
    public Instant getCanceladoEn(){ return canceladoEn; } public void setCanceladoEn(Instant v){ this.canceladoEn=v; }
}
