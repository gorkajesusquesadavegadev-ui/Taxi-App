package com.taya.model;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "usuarios")
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String nombre;
    @Column(nullable = false, unique = true) private String email;
    // Nullable: una cuenta creada por "Continuar con Google" no tiene contraseña
    // propia (nadie la sabe, ni siquiera el usuario) hasta que decida ponerse una.
    @Column(name = "password_hash") private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Rol rol;
    // Identificador estable de Google ("sub" del id_token) para la cuenta
    // vinculada por "Continuar con Google". Nullable: la mayoría de cuentas
    // siguen siendo email+contraseña normal.
    @Column(name = "google_sub", unique = true) private String googleSub;
    private String licencia;
    @Column(name = "vehiculo_matricula") private String vehiculoMatricula;
    @Column(name = "vehiculo_modelo") private String vehiculoModelo;
    private String telefono; // contacto WhatsApp para reservas
    private boolean activo = true;
    @Column(name = "creado_en") private Instant creadoEn = Instant.now();
    // Verificación de taxistas: el admin aprueba tras revisar licencia/documentos.
    // Wrapper types (nullable): toleran las filas previas de 'usuarios' que se
    // crearon con NULL al añadirse estas columnas. Los getters normalizan a
    // valor por defecto, así el resto del código sigue viendo primitivos.
    private Boolean verificado = Boolean.FALSE;
    @Column(name = "documento_url") private String documentoUrl; // foto licencia/DNI subida
    private Boolean bloqueado = Boolean.FALSE;
    // Reputación: media y nº de valoraciones recibidas (denormalizado para lectura rápida).
    @Column(name = "rating_media") private Double ratingMedia = 0.0;
    @Column(name = "rating_count") private Integer ratingCount = 0;
    // Disponibilidad para PUSH: persiste hasta que el taxista pulsa "Desconectar"
    // (no caduca al cerrar la app, a diferencia del estado Redis). Última posición
    // conocida para dirigir el push a los taxistas cercanos. Wrappers nullable.
    private Boolean disponible = Boolean.FALSE;
    @Column(name = "ultima_lat") private Double ultimaLat;
    @Column(name = "ultima_lng") private Double ultimaLng;
    // Vehículo adaptado para silla de ruedas (taxista). Wrapper nullable.
    @Column(name = "vehiculo_accesible") private Boolean vehiculoAccesible = Boolean.FALSE;

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; } public void setNombre(String v) { this.nombre = v; }
    public String getEmail() { return email; } public void setEmail(String v) { this.email = v; }
    public String getPasswordHash() { return passwordHash; } public void setPasswordHash(String v) { this.passwordHash = v; }
    public Rol getRol() { return rol; } public void setRol(Rol v) { this.rol = v; }
    public String getGoogleSub() { return googleSub; } public void setGoogleSub(String v) { this.googleSub = v; }
    public String getLicencia() { return licencia; } public void setLicencia(String v) { this.licencia = v; }
    public String getVehiculoMatricula() { return vehiculoMatricula; } public void setVehiculoMatricula(String v) { this.vehiculoMatricula = v; }
    public String getVehiculoModelo() { return vehiculoModelo; } public void setVehiculoModelo(String v) { this.vehiculoModelo = v; }
    public String getTelefono() { return telefono; } public void setTelefono(String v) { this.telefono = v; }
    public boolean isActivo() { return activo; } public void setActivo(boolean v) { this.activo = v; }
    public Instant getCreadoEn() { return creadoEn; } public void setCreadoEn(Instant v) { this.creadoEn = v; }
    public boolean isVerificado() { return Boolean.TRUE.equals(verificado); } public void setVerificado(boolean v) { this.verificado = v; }
    public String getDocumentoUrl() { return documentoUrl; } public void setDocumentoUrl(String v) { this.documentoUrl = v; }
    public boolean isBloqueado() { return Boolean.TRUE.equals(bloqueado); } public void setBloqueado(boolean v) { this.bloqueado = v; }
    public double getRatingMedia() { return ratingMedia == null ? 0 : ratingMedia; } public void setRatingMedia(double v) { this.ratingMedia = v; }
    public int getRatingCount() { return ratingCount == null ? 0 : ratingCount; } public void setRatingCount(int v) { this.ratingCount = v; }
    public boolean isDisponible() { return Boolean.TRUE.equals(disponible); } public void setDisponible(boolean v) { this.disponible = v; }
    public Double getUltimaLat() { return ultimaLat; } public void setUltimaLat(Double v) { this.ultimaLat = v; }
    public Double getUltimaLng() { return ultimaLng; } public void setUltimaLng(Double v) { this.ultimaLng = v; }
    public boolean isVehiculoAccesible() { return Boolean.TRUE.equals(vehiculoAccesible); } public void setVehiculoAccesible(boolean v) { this.vehiculoAccesible = v; }
}
