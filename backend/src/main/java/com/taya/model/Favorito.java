package com.taya.model;
import jakarta.persistence.*;
import java.time.Instant;

/** Dirección favorita de un cliente (Casa, Trabajo, etc.) para pedir con un toque. */
@Entity @Table(name = "favoritos",
    indexes = @Index(name = "idx_favorito_usuario", columnList = "usuario_id"))
public class Favorito {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "usuario_id", nullable = false) private Long usuarioId;
    @Column(nullable = false, length = 40) private String etiqueta;     // "Casa", "Trabajo"...
    @Column(length = 200) private String direccion;                     // texto legible
    @Column(nullable = false) private double lat;
    @Column(nullable = false) private double lng;
    @Column(name = "creado_en", nullable = false) private Instant creadoEn = Instant.now();

    public Long getId(){ return id; } public void setId(Long v){ this.id=v; }
    public Long getUsuarioId(){ return usuarioId; } public void setUsuarioId(Long v){ this.usuarioId=v; }
    public String getEtiqueta(){ return etiqueta; } public void setEtiqueta(String v){ this.etiqueta=v; }
    public String getDireccion(){ return direccion; } public void setDireccion(String v){ this.direccion=v; }
    public double getLat(){ return lat; } public void setLat(double v){ this.lat=v; }
    public double getLng(){ return lng; } public void setLng(double v){ this.lng=v; }
    public Instant getCreadoEn(){ return creadoEn; } public void setCreadoEn(Instant v){ this.creadoEn=v; }
}
