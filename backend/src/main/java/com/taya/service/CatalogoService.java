package com.taya.service;
import com.taya.model.TipoViaje;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Catálogo fijo de ofertas con precio cerrado (taxi hasta 4 plazas).
 * Precios orientados a las tarifas reales de transfer/excursión en taxi
 * de Gran Canaria. El precio es por vehículo, no por persona.
 * paradas: puntos intermedios [lat,lng] para que la ruta y los km del mapa
 * sigan el recorrido real de la excursión (no la línea origen→destino).
 */
@Service
public class CatalogoService {
    public record Oferta(String id, TipoViaje tipo, String nombre, String descripcion,
                         String duracion, BigDecimal precio,
                         double origenLat, double origenLng,
                         double destinoLat, double destinoLng,
                         List<double[]> paradas) {}

    private static final List<double[]> SIN_PARADAS = List.of();

    private static final List<Oferta> OFERTAS = List.of(
        // ---- Transfers (punto a punto, precio cerrado) ----
        new Oferta("T-AERO-LPA", TipoViaje.TRANSFER, "Aeropuerto → Las Palmas",
            "Recogida en llegadas y traslado directo a tu hotel o dirección en la capital.",
            "≈ 25 min", new BigDecimal("33.00"), 27.9319, -15.3866, 28.1080, -15.4172, SIN_PARADAS),
        new Oferta("T-AERO-SUR", TipoViaje.TRANSFER, "Aeropuerto → Maspalomas",
            "Traslado directo a Maspalomas y Playa del Inglés.",
            "≈ 30 min", new BigDecimal("48.00"), 27.9319, -15.3866, 27.7568, -15.5868, SIN_PARADAS),
        new Oferta("T-AERO-MOGAN", TipoViaje.TRANSFER, "Aeropuerto → Puerto de Mogán",
            "Traslado directo al suroeste: Puerto Rico y Puerto de Mogán.",
            "≈ 45 min", new BigDecimal("68.00"), 27.9319, -15.3866, 27.8170, -15.7637, SIN_PARADAS),
        new Oferta("T-LPA-SUR", TipoViaje.TRANSFER, "Las Palmas → Maspalomas",
            "De la capital a la zona turística del sur, sin esperas.",
            "≈ 40 min", new BigDecimal("60.00"), 28.1235, -15.4363, 27.7568, -15.5868, SIN_PARADAS),
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
        return OFERTAS.stream().filter(o -> o.tipo() == TipoViaje.TRANSFER).toList();
    }
    public List<Oferta> excursiones() {
        return OFERTAS.stream().filter(o -> o.tipo() == TipoViaje.EXCURSION).toList();
    }
    public Optional<Oferta> porId(String id) {
        return OFERTAS.stream().filter(o -> o.id().equals(id)).findFirst();
    }
}
