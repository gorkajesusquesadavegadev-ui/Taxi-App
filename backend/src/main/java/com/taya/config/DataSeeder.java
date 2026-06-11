package com.taya.config;
import com.taya.model.ConfiguracionTarifa;
import com.taya.repository.ConfiguracionTarifaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

/**
 * Siembra/actualiza la tarifa de referencia con valores aproximados a la
 * ordenanza de taxi urbano de Las Palmas de Gran Canaria (tarifa 1 diurna):
 * bajada de bandera 2,55 €, 0,62 €/km, carrera mínima 4,10 €, y recargo del
 * 20% en horario nocturno (22:00–06:00) y domingos/festivos (tarifa 2).
 */
@Component
public class DataSeeder implements CommandLineRunner {
    private final ConfiguracionTarifaRepository repo;
    public DataSeeder(ConfiguracionTarifaRepository repo) { this.repo = repo; }
    @Override public void run(String... args) {
        var c = repo.findAll().stream().findFirst().orElseGet(ConfiguracionTarifa::new);
        c.setBajadaBandera(new BigDecimal("2.55"));
        c.setPrecioKm(new BigDecimal("0.62"));
        c.setCarreraMinima(new BigDecimal("4.10"));
        c.setRecargoNocturnoPct(new BigDecimal("0.20"));
        if (c.getRadioBusquedaKm() == null) c.setRadioBusquedaKm(new BigDecimal("5"));
        repo.save(c);
    }
}
