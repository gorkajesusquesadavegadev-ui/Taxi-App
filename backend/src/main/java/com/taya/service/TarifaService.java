package com.taya.service;
import com.taya.dto.response.EstimacionResponse;
import com.taya.repository.ConfiguracionTarifaRepository;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.*;
import java.util.Set;

/**
 * Tarifas oficiales del taxi de Las Palmas de Gran Canaria (BOC nº 150,
 * 31/07/2023). La bajada de bandera incluye 1.032 m; a partir de ahí se cobra
 * por km. Se aplica la franja correspondiente (diurna/nocturna/festiva/Navidad)
 * según la hora canaria. Viajes que tocan Las Palmas usan esta tabla; el resto,
 * una tarifa estándar diurna/nocturna equivalente.
 */
@Service
public class TarifaService {
    private final ConfiguracionTarifaRepository repo;
    private final OsrmClient osrm;
    public TarifaService(ConfiguracionTarifaRepository repo, OsrmClient osrm) { this.repo = repo; this.osrm = osrm; }

    private static final ZoneId CANARIAS = ZoneId.of("Atlantic/Canary");
    private static final BigDecimal KM_INCLUIDOS = new BigDecimal("1.032"); // bajada de bandera
    private static final BigDecimal MINIMO_NAVIDAD = new BigDecimal("6.20");

    // bounding box aproximado del municipio de Las Palmas de Gran Canaria
    private static boolean enLasPalmas(double lat, double lng) {
        return lat >= 28.04 && lat <= 28.20 && lng >= -15.48 && lng <= -15.36;
    }

    // festivos fijos en Canarias/nacionales (sin móviles); domingo siempre festivo
    private static final Set<MonthDay> FESTIVOS = Set.of(
        MonthDay.of(1, 1), MonthDay.of(1, 6), MonthDay.of(5, 1), MonthDay.of(5, 30),
        MonthDay.of(8, 15), MonthDay.of(10, 12), MonthDay.of(11, 1), MonthDay.of(12, 6),
        MonthDay.of(12, 8), MonthDay.of(12, 25));

    private record Tarifa(BigDecimal bandera, BigDecimal km, boolean minimoNavidad) {}

    /** Tarifa LPGC según el momento (franja horaria + festivos + Navidad). */
    private Tarifa tarifaLP(ZonedDateTime t) {
        MonthDay md = MonthDay.of(t.getMonthValue(), t.getDayOfMonth());
        int h = t.getHour();
        boolean navidadAlta = (md.equals(MonthDay.of(12, 25)) || md.equals(MonthDay.of(1, 1))
            || md.equals(MonthDay.of(1, 6))) && h >= 9 && h < 22;
        if (navidadAlta) return new Tarifa(new BigDecimal("4.30"), new BigDecimal("0.85"), false);

        boolean vispera = md.equals(MonthDay.of(12, 24)) || md.equals(MonthDay.of(12, 31))
            || md.equals(MonthDay.of(1, 5));
        boolean minNav = vispera && (h >= 22 || h < 9); // mínimo de percepción 6,20 €
        boolean nocturna = h >= 22 || h < 6;
        boolean festivo = t.getDayOfWeek() == DayOfWeek.SUNDAY || FESTIVOS.contains(md);

        if (nocturna) return new Tarifa(new BigDecimal("3.65"), new BigDecimal("0.85"), minNav);
        if (vispera || festivo) // diurno festivo / víspera de Navidad
            return new Tarifa(new BigDecimal("3.65"), new BigDecimal("0.85"), minNav);
        return new Tarifa(new BigDecimal("2.95"), new BigDecimal("0.80"), false); // laborable diurno
    }

    /** Tarifa estándar fuera de Las Palmas: solo diurna/nocturna. */
    private Tarifa tarifaEstandar(ZonedDateTime t) {
        int h = t.getHour();
        boolean nocturna = h >= 22 || h < 6;
        return nocturna
            ? new Tarifa(new BigDecimal("3.65"), new BigDecimal("0.85"), false)
            : new Tarifa(new BigDecimal("2.95"), new BigDecimal("0.80"), false);
    }

    private BigDecimal aplicar(Tarifa tar, double km) {
        BigDecimal cobrable = BigDecimal.valueOf(km).subtract(KM_INCLUIDOS).max(BigDecimal.ZERO);
        BigDecimal precio = tar.bandera().add(tar.km().multiply(cobrable));
        if (tar.minimoNavidad() && precio.compareTo(MINIMO_NAVIDAD) < 0) precio = MINIMO_NAVIDAD;
        return precio.setScale(2, RoundingMode.HALF_UP);
    }

    /** Precio de una carrera por km, eligiendo tabla según si toca Las Palmas. */
    public BigDecimal precioPorRuta(double oLat, double oLng, double dLat, double dLng, double km) {
        var ahora = ZonedDateTime.now(CANARIAS);
        boolean lp = enLasPalmas(oLat, oLng) || enLasPalmas(dLat, dLng);
        return aplicar(lp ? tarifaLP(ahora) : tarifaEstandar(ahora), km);
    }

    public EstimacionResponse estimar(double oLat, double oLng, double dLat, double dLng) {
        var ruta = osrm.rutaEntre(oLat, oLng, dLat, dLng);
        return new EstimacionResponse(BigDecimal.valueOf(ruta.km()),
            BigDecimal.valueOf(Math.ceil(ruta.duracionMin())),
            precioPorRuta(oLat, oLng, dLat, dLng, ruta.km()), ruta.puntos());
    }

    public BigDecimal radioBusquedaKm() {
        return repo.findAll().stream().findFirst()
            .map(c -> c.getRadioBusquedaKm()).orElse(new BigDecimal("5"));
    }
}
