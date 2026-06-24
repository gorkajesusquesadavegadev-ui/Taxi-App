package com.taya.config;
import com.taya.model.ConfiguracionTarifa;
import com.taya.model.Evento;
import com.taya.model.Rol;
import com.taya.model.Usuario;
import com.taya.repository.ConfiguracionTarifaRepository;
import com.taya.repository.EventoRepository;
import com.taya.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

/**
 * Siembra/actualiza la tarifa de referencia con valores aproximados a la
 * ordenanza de taxi urbano de Las Palmas de Gran Canaria (tarifa 1 diurna):
 * bajada de bandera 2,55 €, 0,62 €/km, carrera mínima 4,10 €, y recargo del
 * 20% en horario nocturno (22:00–06:00) y domingos/festivos (tarifa 2).
 */
@Component
public class DataSeeder implements CommandLineRunner {
    private final ConfiguracionTarifaRepository repo;
    private final EventoRepository eventos;
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    @Value("${admin.email:admin@canarycab.com}") private String adminEmail;
    @Value("${admin.password:CanaryCab-Admin-2024}") private String adminPassword;

    public DataSeeder(ConfiguracionTarifaRepository repo, EventoRepository eventos,
                      UsuarioRepository usuarios, PasswordEncoder encoder) {
        this.repo = repo; this.eventos = eventos; this.usuarios = usuarios; this.encoder = encoder;
    }
    @Override public void run(String... args) {
        var c = repo.findAll().stream().findFirst().orElseGet(ConfiguracionTarifa::new);
        c.setBajadaBandera(new BigDecimal("2.55"));
        c.setPrecioKm(new BigDecimal("0.62"));
        c.setCarreraMinima(new BigDecimal("4.10"));
        c.setRecargoNocturnoPct(new BigDecimal("0.20"));
        if (c.getRadioBusquedaKm() == null) c.setRadioBusquedaKm(new BigDecimal("5"));
        repo.save(c);
        sembrarEventos();
        sembrarAdmin();
    }

    /** Crea el usuario admin y, en el primer arranque, verifica a los taxistas
     *  ya existentes para no dejar fuera a quien se registró antes del sistema
     *  de verificación. Idempotente: solo corre cuando el admin aún no existe. */
    private void sembrarAdmin() {
        if (usuarios.existsByEmail(adminEmail)) return;
        // Primer arranque con verificación: dar por verificados los taxistas previos.
        usuarios.findByRolOrderByCreadoEnDesc(Rol.TAXISTA).forEach(t -> {
            if (!t.isVerificado()) { t.setVerificado(true); usuarios.save(t); }
        });
        Usuario admin = new Usuario();
        admin.setNombre("Administrador");
        admin.setEmail(adminEmail);
        admin.setPasswordHash(encoder.encode(adminPassword));
        admin.setRol(Rol.ADMIN);
        admin.setVerificado(true);
        usuarios.save(admin);
    }

    /** Eventos demo relativos a hoy para que el mapa de demanda tenga señal. */
    private void sembrarEventos() {
        if (eventos.count() > 0) return;
        Instant ahora = Instant.now();
        eventos.save(evento("Crucero en Muelle Santa Catalina", "CRUCERO",
            28.1450, -15.4280, ahora.minus(Duration.ofHours(1)), ahora.plus(Duration.ofHours(8)), 7));
        eventos.save(evento("UD Las Palmas · Estadio de Gran Canaria", "FUTBOL",
            28.1004, -15.4565, ahora.plus(Duration.ofHours(26)), ahora.plus(Duration.ofHours(30)), 9));
        eventos.save(evento("Concierto · Auditorio Alfredo Kraus", "CONCIERTO",
            28.1399, -15.4534, ahora.plus(Duration.ofHours(6)), ahora.plus(Duration.ofHours(10)), 6));
    }

    private static Evento evento(String nombre, String tipo, double lat, double lng,
                                 Instant inicio, Instant fin, int magnitud) {
        var e = new Evento();
        e.setNombre(nombre); e.setTipo(tipo); e.setLat(lat); e.setLng(lng);
        e.setInicio(inicio); e.setFin(fin); e.setMagnitud(magnitud);
        return e;
    }
}
