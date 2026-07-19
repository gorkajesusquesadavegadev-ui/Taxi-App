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
 *   la ruta real, con caché de 10 min. El precio del catálogo es solo fallback
 *   si OSRM/tarifa no responde.
 * - Excursiones: precio aproximado por duración.
 * paradas: puntos intermedios [lat,lng] para que la ruta del mapa siga el
 * recorrido real (no la línea origen→destino).
 */
@Service
public class CatalogoService {
    public record Oferta(String id, TipoViaje tipo, String nombre, String descripcion,
                         String duracion, BigDecimal precio,
                         double origenLat, double origenLng,
                         double destinoLat, double destinoLng,
                         List<double[]> paradas) {}

    private static final List<double[]> SIN_PARADAS = List.of();
    private static final Duration CACHE_PRECIO = Duration.ofMinutes(10);

    private final TarifaService tarifa;
    public CatalogoService(TarifaService tarifa) { this.tarifa = tarifa; }

    private record PrecioCacheado(BigDecimal precio, Instant calculadoEn) {}
    private final Map<String, PrecioCacheado> precios = new ConcurrentHashMap<>();

    /** Transfers a precio de taxímetro vigente (día/noche): mismo cálculo que el mapa. */
    private Oferta conPrecioVigente(Oferta o) {
        if (o.tipo() != TipoViaje.TRANSFER) return o;
        PrecioCacheado c = precios.get(o.id());
        if (c == null || c.calculadoEn().isBefore(Instant.now().minus(CACHE_PRECIO))) {
            BigDecimal p;
            try {
                p = tarifa.estimar(o.origenLat(), o.origenLng(), o.destinoLat(), o.destinoLng()).precioEstimado();
            } catch (Exception e) {
                p = null;
            }
            c = new PrecioCacheado(p != null ? p : o.precio(), Instant.now());
            precios.put(o.id(), c);
        }
        return new Oferta(o.id(), o.tipo(), o.nombre(), o.descripcion(), o.duracion(), c.precio(),
            o.origenLat(), o.origenLng(), o.destinoLat(), o.destinoLng(), o.paradas());
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
