package com.taya.model;
import jakarta.persistence.*;
import java.time.Instant;

/** Suscripción Web Push de un navegador/dispositivo a un usuario. */
@Entity @Table(name = "push_subscriptions",
    indexes = @Index(name = "idx_push_usuario", columnList = "usuario_id"))
public class PushSubscription {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "usuario_id", nullable = false) private Long usuarioId;
    @Column(nullable = false, unique = true, length = 600) private String endpoint;
    @Column(nullable = false, length = 300) private String p256dh; // clave pública del cliente
    @Column(nullable = false, length = 300) private String auth;   // secreto de autenticación
    @Column(name = "creado_en", nullable = false) private Instant creadoEn = Instant.now();

    public Long getId(){ return id; } public void setId(Long v){ this.id=v; }
    public Long getUsuarioId(){ return usuarioId; } public void setUsuarioId(Long v){ this.usuarioId=v; }
    public String getEndpoint(){ return endpoint; } public void setEndpoint(String v){ this.endpoint=v; }
    public String getP256dh(){ return p256dh; } public void setP256dh(String v){ this.p256dh=v; }
    public String getAuth(){ return auth; } public void setAuth(String v){ this.auth=v; }
    public Instant getCreadoEn(){ return creadoEn; } public void setCreadoEn(Instant v){ this.creadoEn=v; }
}
