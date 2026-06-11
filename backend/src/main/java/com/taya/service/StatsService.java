package com.taya.service;
import com.taya.model.EstadoViaje;
import com.taya.model.Viaje;
import com.taya.repository.EventoRepository;
import com.taya.repository.ViajeRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Analítica sobre los viajes guardados en BD.
 * - Stats personales: gasto/ganancia por día (14d) y mes (6m), rutas top con
 *   su probabilidad (% sobre el total de viajes completados).
 * - Zonas calientes: malla geográfica de recogidas con decaimiento
 *   exponencial (media vida 7 días) + impulso de eventos (fútbol, conciertos,
 *   cruceros). Nivel ALTO/MEDIO/BAJO relativo al máximo actual.
 */
@Service
public class StatsService {
    private static final ZoneId TZ = ZoneId.of("Atlantic/Canary");
    private static final double CELDA = 0.012;        // ~1.2 km de malla
    private static final double MEDIA_VIDA_DIAS = 7;  // peso de un viaje cae a la mitad cada 7 días

    private final ViajeRepository viajes;
    private final EventoRepository eventos;
    public StatsService(ViajeRepository v, EventoRepository e) { this.viajes = v; this.eventos = e; }

    public record PuntoSerie(String etiqueta, BigDecimal valor) {}
    public record RutaTop(String origen, String destino, long veces, int pct) {}
    public record StatsResponse(long viajes, BigDecimal total, BigDecimal km,
                                List<PuntoSerie> porDia, List<PuntoSerie> porMes,
                                List<RutaTop> topRutas) {}
    public record ZonaCaliente(double lat, double lng, int radioM, String nivel,
                               double peso, String motivo) {}

    /* ---------------- stats personales ---------------- */

    public StatsResponse statsDe(Long usuarioId, boolean esTaxista) {
        List<Viaje> todos = esTaxista
            ? viajes.findByTaxistaIdOrderBySolicitadoEnDesc(usuarioId)
            : viajes.findByClienteIdOrderBySolicitadoEnDesc(usuarioId);
        List<Viaje> completados = todos.stream()
            .filter(v -> v.getEstado() == EstadoViaje.COMPLETADO).toList();

        BigDecimal total = suma(completados, true);
        BigDecimal km = suma(completados, false);

        // serie diaria (últimos 14 días) y mensual (últimos 6 meses)
        LocalDate hoy = LocalDate.now(TZ);
        var fmtDia = DateTimeFormatter.ofPattern("EEE d", new Locale("es", "ES"));
        var fmtMes = DateTimeFormatter.ofPattern("MMM", new Locale("es", "ES"));
        List<PuntoSerie> porDia = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = hoy.minusDays(i);
            porDia.add(new PuntoSerie(fmtDia.format(d), importeEn(completados, d, null)));
        }
        List<PuntoSerie> porMes = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth m = YearMonth.from(hoy).minusMonths(i);
            porMes.add(new PuntoSerie(fmtMes.format(m), importeEn(completados, null, m)));
        }

        // rutas más repetidas → probabilidad de tu próximo viaje
        Map<String, long[]> rutas = new LinkedHashMap<>(); // clave -> [veces]
        Map<String, String[]> textos = new HashMap<>();
        for (Viaje v : completados) {
            String o = etiquetaOrigen(v), d = etiquetaDestino(v);
            String key = o + "→" + d;
            rutas.computeIfAbsent(key, k -> new long[1])[0]++;
            textos.putIfAbsent(key, new String[]{o, d});
        }
        long totalComp = completados.size();
        List<RutaTop> top = rutas.entrySet().stream()
            .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
            .limit(5)
            .map(e -> new RutaTop(textos.get(e.getKey())[0], textos.get(e.getKey())[1],
                e.getValue()[0],
                totalComp == 0 ? 0 : (int) Math.round(e.getValue()[0] * 100.0 / totalComp)))
            .toList();

        return new StatsResponse(totalComp, total, km, porDia, porMes, top);
    }

    private static String etiquetaOrigen(Viaje v) {
        if (v.getOrigenTexto() != null && !v.getOrigenTexto().isBlank()) return v.getOrigenTexto();
        return "Punto en el mapa";
    }
    private static String etiquetaDestino(Viaje v) {
        if (v.getDetalle() != null && !v.getDetalle().isBlank()) return v.getDetalle();
        if (v.getDestinoTexto() != null && !v.getDestinoTexto().isBlank()) return v.getDestinoTexto();
        return "Punto en el mapa";
    }

    private static BigDecimal suma(List<Viaje> vs, boolean dinero) {
        BigDecimal s = BigDecimal.ZERO;
        for (Viaje v : vs) {
            BigDecimal x = dinero ? v.getPrecioFinal() : v.getDistanciaRealKm();
            if (x != null) s = s.add(x);
        }
        return s.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal importeEn(List<Viaje> vs, LocalDate dia, YearMonth mes) {
        BigDecimal s = BigDecimal.ZERO;
        for (Viaje v : vs) {
            Instant t = v.getCompletadoEn() != null ? v.getCompletadoEn() : v.getSolicitadoEn();
            if (t == null || v.getPrecioFinal() == null) continue;
            LocalDate d = LocalDate.ofInstant(t, TZ);
            boolean in = dia != null ? d.equals(dia) : YearMonth.from(d).equals(mes);
            if (in) s = s.add(v.getPrecioFinal());
        }
        return s.setScale(2, RoundingMode.HALF_UP);
    }

    /* ---------------- zonas calientes ---------------- */

    public List<ZonaCaliente> zonasCalientes() {
        Instant ahora = Instant.now();
        Map<String, double[]> celdas = new HashMap<>(); // key -> [peso, latSum, lngSum, n]

        // histórico de recogidas (30 días) con decaimiento exponencial
        for (Viaje v : viajes.findBySolicitadoEnAfter(ahora.minus(Duration.ofDays(30)))) {
            if (v.getSolicitadoEn() == null) continue;
            double edadDias = Duration.between(v.getSolicitadoEn(), ahora).toHours() / 24.0;
            double peso = Math.pow(0.5, edadDias / MEDIA_VIDA_DIAS);
            acumular(celdas, v.getOrigenLat(), v.getOrigenLng(), peso);
        }

        List<ZonaCaliente> zonas = new ArrayList<>();
        double maxHist = celdas.values().stream().mapToDouble(c -> c[0]).max().orElse(0);

        // eventos en las próximas 48 h (activos pesan completo, futuros al 60%)
        for (var e : eventos.findByFinAfterAndInicioBefore(ahora, ahora.plus(Duration.ofHours(48)))) {
            boolean activo = !e.getInicio().isAfter(ahora);
            double peso = e.getMagnitud() * (activo ? 1.0 : 0.6);
            String cuando = activo ? "ahora" : "próximamente";
            zonas.add(new ZonaCaliente(e.getLat(), e.getLng(), 600,
                nivelDe(peso, 9), peso, e.getNombre() + " (" + cuando + ")"));
        }

        for (var c : celdas.values()) {
            double peso = c[0];
            if (peso < 0.4) continue; // ruido
            zonas.add(new ZonaCaliente(c[1] / c[3], c[2] / c[3], 500,
                nivelDe(peso, Math.max(maxHist, 1)), peso, null));
        }
        zonas.sort((a, b) -> Double.compare(b.peso(), a.peso()));
        return zonas.size() > 40 ? zonas.subList(0, 40) : zonas;
    }

    private static void acumular(Map<String, double[]> celdas, double lat, double lng, double peso) {
        String key = Math.round(lat / CELDA) + ":" + Math.round(lng / CELDA);
        double[] c = celdas.computeIfAbsent(key, k -> new double[4]);
        c[0] += peso; c[1] += lat; c[2] += lng; c[3] += 1;
    }

    private static String nivelDe(double peso, double max) {
        double r = peso / max;
        if (r >= 0.66) return "ALTO";
        if (r >= 0.33) return "MEDIO";
        return "BAJO";
    }
}
