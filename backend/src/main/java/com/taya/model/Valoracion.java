package com.taya.model;
import jakarta.persistence.*;
import java.time.Instant;

/** Valoración (1-5★) que un participante deja al otro tras un viaje completado. */
@Entity @Table(name = "valoraciones",
    uniqueConstraints = @UniqueConstraint(name = "uq_valoracion_viaje_autor", columnNames = {"viaje_id", "autor_id"}),
    indexes = @Index(name = "idx_valoracion_destinatario", columnList = "destinatario_id"))
public class Valoracion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "viaje_id", nullable = false) private Long viajeId;
    @Column(name = "autor_id", nullable = false) private Long autorId;
    @Column(name = "destinatario_id", nullable = false) private Long destinatarioId;
    @Column(nullable = false) private int estrellas;       // 1..5
    @Column(length = 500) private String comentario;
    @Column(name = "creado_en", nullable = false) private Instant creadoEn = Instant.now();

    public Long getId(){ return id; } public void setId(Long v){ this.id=v; }
    public Long getViajeId(){ return viajeId; } public void setViajeId(Long v){ this.viajeId=v; }
    public Long getAutorId(){ return autorId; } public void setAutorId(Long v){ this.autorId=v; }
    public Long getDestinatarioId(){ return destinatarioId; } public void setDestinatarioId(Long v){ this.destinatarioId=v; }
    public int getEstrellas(){ return estrellas; } public void setEstrellas(int v){ this.estrellas=v; }
    public String getComentario(){ return comentario; } public void setComentario(String v){ this.comentario=v; }
    public Instant getCreadoEn(){ return creadoEn; } public void setCreadoEn(Instant v){ this.creadoEn=v; }
}
