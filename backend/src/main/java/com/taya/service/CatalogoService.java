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
        // ---- Excursiones (recogida donde elija el cliente; ruta con paradas reales) ----
        new Oferta("E-NUBLO", TipoViaje.EXCURSION, "Roque Nublo y cumbres",
            "Tejeda, mirador del Pico de las Nieves y subida al Roque Nublo.",
            "4 h", new BigDecimal("120.00"), 28.1235, -15.4363, 27.9610, -15.6130,
            List.of(new double[]{28.0070, -15.5360},   // Santa Brígida
                    new double[]{27.9620, -15.5720},   // Pico de las Nieves
                    new double[]{27.9947, -15.6155})), // Tejeda
        new Oferta("E-DUNAS-MOGAN", TipoViaje.EXCURSION, "Dunas + Puerto de Mogán",
            "Faro y dunas de Maspalomas con parada final en la «pequeña Venecia».",
            "4 h", new BigDecimal("110.00"), 28.1235, -15.4363, 27.8170, -15.7637,
            List.of(new double[]{27.7340, -15.5965})), // Faro de Maspalomas
        new Oferta("E-TEROR", TipoViaje.EXCURSION, "Teror y Arucas",
            "Basílica del Pino, casco histórico y fábrica de ron de Arucas.",
            "3 h", new BigDecimal("90.00"), 28.1235, -15.4363, 28.1180, -15.5210,
            List.of(new double[]{28.0594, -15.5475})), // Teror, destino Arucas
        new Oferta("E-BANDAMA", TipoViaje.EXCURSION, "Bandama y Jardín Canario",
            "Caldera de Bandama y paseo por el Jardín Botánico Canario.",
            "2,5 h", new BigDecimal("70.00"), 28.1235, -15.4363, 28.0640, -15.4630,
            List.of(new double[]{28.0330, -15.4660})), // Caldera de Bandama
        new Oferta("E-ISLA", TipoViaje.EXCURSION, "Vuelta a la isla",
            "Día completo: norte verde, Agaete, costa oeste, Mogán y las dunas.",
            "7 h", new BigDecimal("180.00"), 28.1235, -15.4363, 28.1235, -15.4363,
            List.of(new double[]{28.1470, -15.6500},   // Gáldar
                    new double[]{28.1000, -15.7035},   // Agaete
                    new double[]{27.8170, -15.7637},   // Puerto de Mogán
                    new double[]{27.7340, -15.5965}))  // Faro de Maspalomas → vuelta a LPGC
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
