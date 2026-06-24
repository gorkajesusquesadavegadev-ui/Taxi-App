package com.taya.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Reserva programada de un viaje (normal, transfer o excursión) para una fecha
 * y hora futuras. Nace PENDIENTE, se difunde a los taxistas y uno la acepta.
 */
@Entity @Table(name = "reservas", indexes = @Index(name = "idx_reserva_programada", columnList = "programada_para"))
public class Reserva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "cliente_id", nullable = false) private Long clienteId;
    @Column(name = "taxista_id") private Long taxistaId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private TipoViaje tipo = TipoViaje.NORMAL;
    @Column(name = "oferta_id") private String ofertaId;
    private String detalle;
    @Column(name = "origen_lat", nullable = false) private double origenLat;
    @Column(name = "origen_lng", nullable = false) private double origenLng;
    @Column(name = "destino_lat", nullable = false) private double destinoLat;
    @Column(name = "destino_lng", nullable = false) private double destinoLng;
    @Column(name = "origen_texto") private String origenTexto;
    @Column(name = "destino_texto") private String destinoTexto;
    @Column(name = "programada_para", nullable = false) private Instant programadaPara;
    @Column(name = "precio_estimado") private BigDecimal precioEstimado;
    @Column(name = "distancia_km") private BigDecimal distanciaKm;
    private String notas;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private EstadoReserva estado = EstadoReserva.PENDIENTE;
    @Column(name = "viaje_id") private Long viajeId; // viaje generado al activarse la reserva
    @Column(name = "creado_en", nullable = false) private Instant creadoEn = Instant.now();
    // Recordatorio push enviado (30 min antes). Wrapper nullable: evita problemas
    // de migración sobre filas previas (ver Usuario).
    @Column(name = "recordatorio_enviado") private Boolean recordatorioEnviado = Boolean.FALSE;

    public Long getId(){ return id; } public void setId(Long v){ this.id=v; }
    public Long getClienteId(){ return clienteId; } public void setClienteId(Long v){ this.clienteId=v; }
    public Long getTaxistaId(){ return taxistaId; } public void setTaxistaId(Long v){ this.taxistaId=v; }
    public TipoViaje getTipo(){ return tipo; } public void setTipo(TipoViaje v){ this.tipo=v; }
    public String getOfertaId(){ return ofertaId; } public void setOfertaId(String v){ this.ofertaId=v; }
    public String getDetalle(){ return detalle; } public void setDetalle(String v){ this.detalle=v; }
    public double getOrigenLat(){ return origenLat; } public void setOrigenLat(double v){ this.origenLat=v; }
    public double getOrigenLng(){ return origenLng; } public void setOrigenLng(double v){ this.origenLng=v; }
    public double getDestinoLat(){ return destinoLat; } public void setDestinoLat(double v){ this.destinoLat=v; }
    public double getDestinoLng(){ return destinoLng; } public void setDestinoLng(double v){ this.destinoLng=v; }
    public String getOrigenTexto(){ return origenTexto; } public void setOrigenTexto(String v){ this.origenTexto=v; }
    public String getDestinoTexto(){ return destinoTexto; } public void setDestinoTexto(String v){ this.destinoTexto=v; }
    public Instant getProgramadaPara(){ return programadaPara; } public void setProgramadaPara(Instant v){ this.programadaPara=v; }
    public BigDecimal getPrecioEstimado(){ return precioEstimado; } public void setPrecioEstimado(BigDecimal v){ this.precioEstimado=v; }
    public BigDecimal getDistanciaKm(){ return distanciaKm; } public void setDistanciaKm(BigDecimal v){ this.distanciaKm=v; }
    public String getNotas(){ return notas; } public void setNotas(String v){ this.notas=v; }
    public EstadoReserva getEstado(){ return estado; } public void setEstado(EstadoReserva v){ this.estado=v; }
    public Long getViajeId(){ return viajeId; } public void setViajeId(Long v){ this.viajeId=v; }
    public Instant getCreadoEn(){ return creadoEn; } public void setCreadoEn(Instant v){ this.creadoEn=v; }
    public boolean isRecordatorioEnviado(){ return Boolean.TRUE.equals(recordatorioEnviado); }
    public void setRecordatorioEnviado(boolean v){ this.recordatorioEnviado=v; }
}
