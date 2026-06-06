package com.taya.service;
import com.taya.model.ConfiguracionTarifa;
import com.taya.repository.ConfiguracionTarifaRepository;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TarifaServiceTest {
    ConfiguracionTarifaRepository repo;
    OsrmClient osrm;
    TarifaService tarifa;

    @BeforeEach void setup() {
        repo = mock(ConfiguracionTarifaRepository.class);
        osrm = mock(OsrmClient.class);
        var cfg = new ConfiguracionTarifa();
        cfg.setBajadaBandera(new BigDecimal("1.50"));
        cfg.setPrecioKm(new BigDecimal("0.80"));
        cfg.setRadioBusquedaKm(new BigDecimal("5"));
        when(repo.findAll()).thenReturn(java.util.List.of(cfg));
        tarifa = new TarifaService(repo, osrm);
    }

    @Test void estimar_usaDistanciaOsrm() {
        when(osrm.distanciaKm(anyDouble(),anyDouble(),anyDouble(),anyDouble())).thenReturn(10.0);
        var e = tarifa.estimar(28.1,-15.4,28.0,-15.4);
        // 1.50 + 10 * 0.80 = 9.50
        assertThat(e.precioEstimado()).isEqualByComparingTo("9.50");
        assertThat(e.distanciaKm()).isEqualByComparingTo("10.0");
    }

    @Test void precioFinal_desdeDistanciaReal() {
        var p = tarifa.precioFinal(5.0); // 1.50 + 5*0.80 = 5.50
        assertThat(p).isEqualByComparingTo("5.50");
    }
}
