package com.taya.model;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Evento con impacto en la demanda de taxis (partido, concierto, crucero…).
 * magnitud 1-10: cuánta afluencia genera. Se mezcla con el histórico de
 * recogidas para pintar las zonas calientes del mapa del taxista.
 */
@Entity @Table(name = "eventos")
public class Evento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String nombre;
    @Column(nullable = false) private String tipo; // FUTBOL | CONCIERTO | CRUCERO
    @Column(nullable = false) private double lat;
    @Column(nullable = false) private double lng;
    @Column(nullable = false) private Instant inicio;
    @Column(nullable = false) private Instant fin;
    @Column(nullable = false) private int magnitud;

    public Long getId(){ return id; } public void setId(Long v){ this.id=v; }
    public String getNombre(){ return nombre; } public void setNombre(String v){ this.nombre=v; }
    public String getTipo(){ return tipo; } public void setTipo(String v){ this.tipo=v; }
    public double getLat(){ return lat; } public void setLat(double v){ this.lat=v; }
    public double getLng(){ return lng; } public void setLng(double v){ this.lng=v; }
    public Instant getInicio(){ return inicio; } public void setInicio(Instant v){ this.inicio=v; }
    public Instant getFin(){ return fin; } public void setFin(Instant v){ this.fin=v; }
    public int getMagnitud(){ return magnitud; } public void setMagnitud(int v){ this.magnitud=v; }
}
