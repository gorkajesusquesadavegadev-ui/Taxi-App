package com.taya.service;
import com.taya.dto.response.EstimacionResponse;
import com.taya.model.ConfiguracionTarifa;
import com.taya.repository.ConfiguracionTarifaRepository;
import org.springframework.stereotype.Service;
import java.math.*;

@Service
public class TarifaService {
    private final ConfiguracionTarifaRepository repo;
    private final OsrmClient osrm;
    public TarifaService(ConfiguracionTarifaRepository repo, OsrmClient osrm) { this.repo = repo; this.osrm = osrm; }

    private ConfiguracionTarifa cfg() {
        return repo.findAll().stream().findFirst()
            .orElseThrow(() -> new IllegalStateException("configuracion_tarifa vacía"));
    }
    private BigDecimal calcular(ConfiguracionTarifa c, double km) {
        return c.getBajadaBandera()
            .add(c.getPrecioKm().multiply(BigDecimal.valueOf(km)))
            .setScale(2, RoundingMode.HALF_UP);
    }

    public EstimacionResponse estimar(double oLat, double oLng, double dLat, double dLng) {
        var c = cfg();
        double km = osrm.distanciaKm(oLat, oLng, dLat, dLng);
        return new EstimacionResponse(BigDecimal.valueOf(km), calcular(c, km));
    }
    public BigDecimal precioFinal(double distanciaRealKm) { return calcular(cfg(), distanciaRealKm); }
    public BigDecimal radioBusquedaKm() { return cfg().getRadioBusquedaKm(); }
}
