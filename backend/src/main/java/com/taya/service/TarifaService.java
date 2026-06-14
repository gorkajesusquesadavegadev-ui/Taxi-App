package com.taya.service;
import com.taya.dto.response.EstimacionResponse;
import com.taya.repository.ConfiguracionTarifaRepository;
import com.taya.util.GeoUtil;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.*;

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
    private final FestivoService festivos;
    public TarifaService(ConfiguracionTarifaRepository repo, OsrmClient osrm, FestivoService festivos) {
        this.repo = repo; this.osrm = osrm; this.festivos = festivos;
    }

    private static final ZoneId CANARIAS = ZoneId.of("Atlantic/Canary");
    private static final BigDecimal KM_INCLUIDOS = new BigDecimal("1.032"); // bajada de bandera
    private static final BigDecimal MINIMO_NAVIDAD = new BigDecimal("6.20");

    // término municipal de Las Palmas de Gran Canaria (incluye barrios altos:
    // Tafira, Marzagán, Tamaraceite, Jinámar…)
    private static boolean enMunicipioLP(double lat, double lng) {
        return lat >= 28.00 && lat <= 28.19 && lng >= -15.50 && lng <= -15.36;
    }

    // centro urbano (Santa Catalina / Mesa y López); el casco bajo es Tarifa 1/2
    private static final double CENTRO_LAT = 28.128, CENTRO_LNG = -15.432;
    private static final double RADIO_CASCO_KM = 6.5; // más allá: barrios periféricos (Tarifa 3)

    private static boolean esPeriferia(double lat, double lng) {
        return GeoUtil.haversineKm(lat, lng, CENTRO_LAT, CENTRO_LNG) > RADIO_CASCO_KM;
    }

    private enum Zona { URBANA, PERIFERIA, INTERURBANO }

    /** Clasifica el viaje: casco urbano (T1/T2), barrio periférico del término
     *  (Tarifa 3) o interurbano a otro municipio (aeropuerto, sur, norte…). */
    private static Zona zonaDe(double oLat, double oLng, double dLat, double dLng) {
        boolean oLP = enMunicipioLP(oLat, oLng), dLP = enMunicipioLP(dLat, dLng);
        if (oLP != dLP || (!oLP && !dLP)) return Zona.INTERURBANO; // sale del término o ajeno
        if (esPeriferia(oLat, oLng) || esPeriferia(dLat, dLng)) return Zona.PERIFERIA;
        return Zona.URBANA;
    }

    // bandera de la franja y precio/km por zona (urbano T1/T2, periferia T3, interurbano)
    private record Franja(BigDecimal bandera, BigDecimal kmUrbano, BigDecimal kmPeriferia,
                          BigDecimal kmInter, boolean minimoNavidad) {}

    /** Franja tarifaria LPGC según el momento (horario + festivos + Navidad). */
    private Franja franja(ZonedDateTime t) {
        MonthDay md = MonthDay.of(t.getMonthValue(), t.getDayOfMonth());
        int h = t.getHour();
        boolean navidadAlta = (md.equals(MonthDay.of(12, 25)) || md.equals(MonthDay.of(1, 1))
            || md.equals(MonthDay.of(1, 6))) && h >= 9 && h < 22;
        if (navidadAlta)
            return new Franja(new BigDecimal("4.30"), new BigDecimal("0.85"), new BigDecimal("1.15"), new BigDecimal("1.25"), false);

        boolean vispera = md.equals(MonthDay.of(12, 24)) || md.equals(MonthDay.of(12, 31))
            || md.equals(MonthDay.of(1, 5));
        boolean minNav = vispera && (h >= 22 || h < 9); // mínimo de percepción 6,20 €
        boolean nocturna = h >= 22 || h < 6;
        // domingo o festivo del calendario (incluye Semana Santa y festivos locales en BD)
        boolean festivo = t.getDayOfWeek() == DayOfWeek.SUNDAY || festivos.esFestivo(t.toLocalDate());

        if (nocturna || vispera || festivo) // 3,65 €: noche, festivo/domingo o víspera de Navidad
            return new Franja(new BigDecimal("3.65"), new BigDecimal("0.85"), new BigDecimal("1.15"), new BigDecimal("1.25"), minNav);
        return new Franja(new BigDecimal("2.95"), new BigDecimal("0.80"), new BigDecimal("1.10"), new BigDecimal("1.20"), false); // laborable diurno
    }

    private BigDecimal aplicar(Franja f, double km, Zona zona) {
        BigDecimal precioKm = switch (zona) {
            case URBANA -> f.kmUrbano();
            case PERIFERIA -> f.kmPeriferia(); // Tarifa 3
            case INTERURBANO -> f.kmInter();
        };
        BigDecimal cobrable = BigDecimal.valueOf(km).subtract(KM_INCLUIDOS).max(BigDecimal.ZERO);
        BigDecimal precio = f.bandera().add(precioKm.multiply(cobrable));
        if (f.minimoNavidad() && precio.compareTo(MINIMO_NAVIDAD) < 0) precio = MINIMO_NAVIDAD;
        return precio.setScale(2, RoundingMode.HALF_UP);
    }

    /** Precio por km según zona: casco urbano (T1/T2), barrio periférico de Las
     *  Palmas (Tarifa 3) o interurbano a otro municipio (aeropuerto, sur, norte). */
    public BigDecimal precioPorRuta(double oLat, double oLng, double dLat, double dLng, double km) {
        var f = franja(ZonedDateTime.now(CANARIAS));
        return aplicar(f, km, zonaDe(oLat, oLng, dLat, dLng));
    }

    public EstimacionResponse estimar(double oLat, double oLng, double dLat, double dLng) {
        var ruta = osrm.rutaEntre(oLat, oLng, dLat, dLng);
        return new EstimacionResponse(BigDecimal.valueOf(ruta.km()),
            BigDecimal.valueOf(Math.ceil(ruta.duracionMin())),
            precioPorRuta(oLat, oLng, dLat, dLng, ruta.km()), ruta.puntos());
    }

    /** Tarifa vigente ahora mismo (para mostrarla a taxistas/clientes). */
    public java.util.Map<String, Object> infoActual() {
        var t = ZonedDateTime.now(CANARIAS);
        var f = franja(t);
        boolean fest = t.getDayOfWeek() == DayOfWeek.SUNDAY || festivos.esFestivo(t.toLocalDate());
        boolean noct = t.getHour() >= 22 || t.getHour() < 6;
        var m = new java.util.LinkedHashMap<String, Object>();
        m.put("franja", noct ? "Nocturna (22-6h)" : fest ? "Festiva/Domingo" : "Diurna laborable");
        m.put("esFestivo", fest);
        m.put("bajadaBandera", f.bandera());
        m.put("metrosIncluidos", 1032);
        m.put("kmUrbano", f.kmUrbano());
        m.put("kmTarifa3", f.kmPeriferia());
        m.put("kmInterurbano", f.kmInter());
        return m;
    }

    public BigDecimal radioBusquedaKm() {
        return repo.findAll().stream().findFirst()
            .map(c -> c.getRadioBusquedaKm()).orElse(new BigDecimal("5"));
    }
}
