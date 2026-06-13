package com.taya.model;
import jakarta.persistence.*;
import java.time.Instant;

/** Mensaje del foro público de taxistas (chat tipo grupo). */
@Entity @Table(name = "mensajes_foro", indexes = @Index(name = "idx_foro_creado", columnList = "creado_en"))
public class MensajeForo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "autor_id", nullable = false) private Long autorId;
    @Column(name = "autor_nombre", nullable = false) private String autorNombre;
    @Column(nullable = false, length = 1000) private String texto;
    @Column(name = "creado_en", nullable = false) private Instant creadoEn = Instant.now();

    public Long getId(){ return id; } public void setId(Long v){ this.id=v; }
    public Long getAutorId(){ return autorId; } public void setAutorId(Long v){ this.autorId=v; }
    public String getAutorNombre(){ return autorNombre; } public void setAutorNombre(String v){ this.autorNombre=v; }
    public String getTexto(){ return texto; } public void setTexto(String v){ this.texto=v; }
    public Instant getCreadoEn(){ return creadoEn; } public void setCreadoEn(Instant v){ this.creadoEn=v; }
}
