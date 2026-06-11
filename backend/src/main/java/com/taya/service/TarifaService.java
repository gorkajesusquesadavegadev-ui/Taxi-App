package com.taya.service;
import com.taya.dto.response.EstimacionResponse;
import com.taya.model.ConfiguracionTarifa;
import com.taya.repository.ConfiguracionTarifaRepository;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
public class TarifaService {
    private final ConfiguracionTarifaRepository repo;
    private final OsrmClient osrm;
    public TarifaService(ConfiguracionTarifaRepository repo, OsrmClient osrm) { this.repo = repo; this.osrm = osrm; }

    private ConfiguracionTarifa cfg() {
        return repo.findAll().stream().findFirst()
            .orElseThrow(() -> new IllegalStateException("configuracion_tarifa vacía"));
    }
    private static final ZoneId CANARIAS = ZoneId.of("Atlantic/Canary");
    private static final BigDecimal MINIMA_DEFECTO = new BigDecimal("4.10");
    private static final BigDecimal RECARGO_DEFECTO = new BigDecimal("0.20");

    /** Tarifa 2 (nocturna/festiva): 22:00–06:00 o domingo, hora canaria. */
    private boolean tarifaNocturna() {
        var ahora = ZonedDateTime.now(CANARIAS);
        int h = ahora.getHour();
        return h >= 22 || h < 6 || ahora.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    private BigDecimal calcular(ConfiguracionTarifa c, double km) {
        BigDecimal precio = c.getBajadaBandera()
            .add(c.getPrecioKm().multiply(BigDecimal.valueOf(km)));
        if (tarifaNocturna()) {
            BigDecimal pct = c.getRecargoNocturnoPct() != null ? c.getRecargoNocturnoPct() : RECARGO_DEFECTO;
            precio = precio.add(precio.multiply(pct));
        }
        BigDecimal minima = c.getCarreraMinima() != null ? c.getCarreraMinima() : MINIMA_DEFECTO;
        if (precio.compareTo(minima) < 0) precio = minima;
        return precio.setScale(2, RoundingMode.HALF_UP);
    }

    public EstimacionResponse estimar(double oLat, double oLng, double dLat, double dLng) {
        var c = cfg();
        var ruta = osrm.rutaEntre(oLat, oLng, dLat, dLng);
        return new EstimacionResponse(BigDecimal.valueOf(ruta.km()),
            BigDecimal.valueOf(Math.ceil(ruta.duracionMin())),
            calcular(c, ruta.km()), ruta.puntos());
    }
    public BigDecimal precioFinal(double distanciaRealKm) { return calcular(cfg(), distanciaRealKm); }
    public BigDecimal radioBusquedaKm() { return cfg().getRadioBusquedaKm(); }
}
