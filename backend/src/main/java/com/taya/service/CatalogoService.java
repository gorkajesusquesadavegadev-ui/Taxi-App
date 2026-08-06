package com.taya.service;
import com.taya.model.TipoViaje;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Catálogo de ofertas (taxi hasta 4 plazas; precio por vehículo, no por persona).
 * - Transfers: salen de Las Palmas (única excepción: Aeropuerto → Las Palmas).
 *   Su precio se calcula con la tarifa oficial vigente (día/noche/festivo) sobre
 *   la ruta real. Solo se cachea la DISTANCIA por carretera (nunca cambia para
 *   un mismo origen→destino fijo, evita golpear el servidor OSRM en cada
 *   consulta del catálogo); el PRECIO se recalcula siempre en vivo — cachear
 *   el precio hacía que, justo al cruzar las 22h o un festivo, el catálogo
 *   siguiera enseñando la tarifa vieja hasta 10 min: dos personas mirando el
 *   mismo transfer con minutos de diferencia veían precios distintos sin
 *   que hubiera pasado nada más que el reloj.
 * - Excursiones: precio aproximado por duración.
 * paradas: puntos intermedios [lat,lng] para que la ruta del mapa siga el
 * recorrido real (no la línea origen→destino).
 */
@Service
public class CatalogoService {
    /**
     * precioMin/precioMax: horquilla que se enseña al cliente en los TRANSFER,
     * que van por taxímetro y por tanto dependen del tráfico y de la ruta real.
     * En las EXCURSIONES van a null a propósito: ahí el precio es una tarifa
     * plana por duración (3 h = 150 €), no una carrera medida, así que un rango
     * sería inventarse una incertidumbre que no existe.
     */
    public record Oferta(String id, TipoViaje tipo, String nombre, String descripcion,
                         String duracion, BigDecimal precio,
                         double origenLat, double origenLng,
                         double destinoLat, double destinoLng,
                         List<double[]> paradas,
                         BigDecimal precioMin, BigDecimal precioMax) {
        // Las ofertas se declaran sin horquilla; se calcula al servirlas.
        public Oferta(String id, TipoViaje tipo, String nombre, String descripcion,
                      String duracion, BigDecimal precio,
                      double origenLat, double origenLng, double destinoLat, double destinoLng,
                      List<double[]> paradas) {
            this(id, tipo, nombre, descripcion, duracion, precio,
                origenLat, origenLng, destinoLat, destinoLng, paradas, null, null);
        }
        Oferta conPrecio(BigDecimal nuevo) {
            var r = tipo == TipoViaje.TRANSFER
                ? com.taya.util.PrecioUtil.horquilla(nuevo)
                : new BigDecimal[]{null, null};
            return new Oferta(id, tipo, nombre, descripcion, duracion, nuevo,
                origenLat, origenLng, destinoLat, destinoLng, paradas, r[0], r[1]);
        }
    }

    private static final List<double[]> SIN_PARADAS = List.of();
    private static final Duration CACHE_KM = Duration.ofHours(6);

    private final TarifaService tarifa;
    private final OsrmClient osrm;
    public CatalogoService(TarifaService tarifa, OsrmClient osrm) { this.tarifa = tarifa; this.osrm = osrm; }

    private record KmCacheado(double km, Instant calculadoEn) {}
    private final Map<String, KmCacheado> distancias = new ConcurrentHashMap<>();

    /** Transfers a precio de taxímetro vigente (día/noche): mismo cálculo que el mapa. */
    private Oferta conPrecioVigente(Oferta o) {
        if (o.tipo() != TipoViaje.TRANSFER) return o;
        KmCacheado c = distancias.get(o.id());
        if (c == null || c.calculadoEn().isBefore(Instant.now().minus(CACHE_KM))) {
            double km;
            try {
                km = osrm.rutaEntre(o.origenLat(), o.origenLng(), o.destinoLat(), o.destinoLng()).km();
            } catch (Exception e) {
                km = -1;
            }
            c = new KmCacheado(km, Instant.now());
            distancias.put(o.id(), c);
        }
        BigDecimal precio;
        try {
            precio = c.km() >= 0
                ? tarifa.precioPorRuta(o.origenLat(), o.origenLng(), o.destinoLat(), o.destinoLng(), c.km())
                : o.precio();
        } catch (Exception e) {
            precio = o.precio();
        }
        return o.conPrecio(precio);
    }

    private static final List<Oferta> OFERTAS = List.of(
        // ---- Transfers desde Las Palmas (precio según tarifa vigente día/noche) ----
        new Oferta("T-AERO-LPA", TipoViaje.TRANSFER, "Aeropuerto → Las Palmas",
            "Recogida en llegadas y traslado directo a tu hotel o dirección en la capital. Precio según tarifa oficial (día/noche).",
            "≈ 25 min", new BigDecimal("33.00"), 27.9319, -15.3866, 28.1080, -15.4172, SIN_PARADAS),
        new Oferta("T-LPA-AERO", TipoViaje.TRANSFER, "Las Palmas → Aeropuerto",
            "De la capital al aeropuerto, puntual para tu vuelo. Precio según tarifa oficial (día/noche).",
            "≈ 25 min", new BigDecimal("33.00"), 28.1080, -15.4172, 27.9319, -15.3866, SIN_PARADAS),
        new Oferta("T-LPA-SUR", TipoViaje.TRANSFER, "Las Palmas → Maspalomas",
            "De la capital a la zona turística del sur, sin esperas. Precio según tarifa oficial (día/noche).",
            "≈ 40 min", new BigDecimal("60.00"), 28.1235, -15.4363, 27.7568, -15.5868, SIN_PARADAS),
        new Oferta("T-LPA-PRICO", TipoViaje.TRANSFER, "Las Palmas → Puerto Rico",
            "Directo a las playas de Puerto Rico de Gran Canaria. Precio según tarifa oficial (día/noche).",
            "≈ 50 min", new BigDecimal("75.00"), 28.1235, -15.4363, 27.7890, -15.7100, SIN_PARADAS),
        new Oferta("T-LPA-MOGAN", TipoViaje.TRANSFER, "Las Palmas → Puerto de Mogán",
            "Hasta la «pequeña Venecia» del suroeste. Precio según tarifa oficial (día/noche).",
            "≈ 55 min", new BigDecimal("85.00"), 28.1235, -15.4363, 27.8170, -15.7637, SIN_PARADAS),
        // ---- Excursiones por duración (precio aproximado, hasta 4 personas) ----
        // La ruta se elige con el taxista: norte, sur, centro, mixta o a medida.
        // Recogida donde diga el cliente (recogidaLat/Lng); circuito con vuelta.
        new Oferta("E-3H", TipoViaje.EXCURSION, "Excursión 3 horas",
            "Ruta norte, sur, centro, mixta o a elegir. Hasta 4 personas. Precio aproximado.",
            "3 h", new BigDecimal("150.00"), 28.1235, -15.4363, 28.1235, -15.4363, SIN_PARADAS),
        new Oferta("E-4H", TipoViaje.EXCURSION, "Excursión 4 horas",
            "Ruta norte, sur, centro, mixta o a elegir. Hasta 4 personas. Precio aproximado.",
            "4 h", new BigDecimal("240.00"), 28.1235, -15.4363, 28.1235, -15.4363, SIN_PARADAS),
        new Oferta("E-5H", TipoViaje.EXCURSION, "Excursión 5 horas",
            "Ruta norte, sur, centro, mixta o a elegir. Hasta 4 personas. Precio aproximado.",
            "5 h", new BigDecimal("290.00"), 28.1235, -15.4363, 28.1235, -15.4363, SIN_PARADAS),
        new Oferta("E-6H", TipoViaje.EXCURSION, "Excursión 6 horas",
            "Ruta norte, sur, centro, mixta o a elegir. Hasta 4 personas. Precio aproximado.",
            "6 h", new BigDecimal("340.00"), 28.1235, -15.4363, 28.1235, -15.4363, SIN_PARADAS),
        new Oferta("E-DIA", TipoViaje.EXCURSION, "Día completo",
            "La isla entera a tu ritmo: ruta norte, sur, centro, mixta o a elegir. Hasta 4 personas. Precio aproximado.",
            "Día completo", new BigDecimal("600.00"), 28.1235, -15.4363, 28.1235, -15.4363, SIN_PARADAS)
    );

    public List<Oferta> transfers() {
        return OFERTAS.stream().filter(o -> o.tipo() == TipoViaje.TRANSFER)
            .map(this::conPrecioVigente).toList();
    }
    public List<Oferta> excursiones() {
        return OFERTAS.stream().filter(o -> o.tipo() == TipoViaje.EXCURSION).toList();
    }
    public Optional<Oferta> porId(String id) {
        return OFERTAS.stream().filter(o -> o.id().equals(id)).findFirst()
            .map(this::conPrecioVigente);
    }
}
