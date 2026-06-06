package com.taya.config;
import com.taya.model.ConfiguracionTarifa;
import com.taya.repository.ConfiguracionTarifaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {
    private final ConfiguracionTarifaRepository repo;
    public DataSeeder(ConfiguracionTarifaRepository repo) { this.repo = repo; }
    @Override public void run(String... args) {
        if (repo.count() == 0) {
            var c = new ConfiguracionTarifa();
            c.setBajadaBandera(new BigDecimal("1.50"));
            c.setPrecioKm(new BigDecimal("0.80"));
            c.setRadioBusquedaKm(new BigDecimal("5"));
            repo.save(c);
        }
    }
}
