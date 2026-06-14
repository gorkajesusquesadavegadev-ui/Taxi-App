package com.taya.service;
import com.taya.model.DiaFestivo;
import com.taya.repository.DiaFestivoRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Calendario de festivos de Las Palmas de Gran Canaria, auto-mantenido. Siembra
 * los festivos nacionales + autonómicos (fijos y de Semana Santa) del año en
 * curso y el siguiente, y los recalcula cada día. Los festivos locales se
 * pueden añadir a mano en la tabla dias_festivos. El cálculo de tarifa consulta
 * aquí, así que el precio festivo es correcto cualquier día del año.
 */
@Service
public class FestivoService {
    private static final ZoneId CANARIAS = ZoneId.of("Atlantic/Canary");
    private final DiaFestivoRepository repo;
    private volatile Set<LocalDate> cache = Set.of();
    private volatile LocalDate cacheDia = null;

    public FestivoService(DiaFestivoRepository repo) { this.repo = repo; }

    @PostConstruct
    public void init() { asegurarSembrado(); recargar(); }

    /** Cada día a las 00:10 (hora canaria): asegura el año siguiente y refresca. */
    @Scheduled(cron = "0 10 0 * * *", zone = "Atlantic/Canary")
    public void diario() { asegurarSembrado(); recargar(); }

    public boolean esFestivo(LocalDate d) {
        LocalDate hoy = LocalDate.now(CANARIAS);
        if (cacheDia == null || !cacheDia.equals(hoy)) recargar();
        return cache.contains(d);
    }

    private synchronized void recargar() {
        Set<LocalDate> s = new HashSet<>();
        for (DiaFestivo f : repo.findAll()) s.add(f.getFecha());
        cache = s;
        cacheDia = LocalDate.now(CANARIAS);
    }

    private synchronized void asegurarSembrado() {
        int año = LocalDate.now(CANARIAS).getYear();
        for (int y = año; y <= año + 1; y++) {
            for (DiaFestivo f : festivosDe(y)) {
                if (!repo.existsByFecha(f.getFecha())) repo.save(f);
            }
        }
    }

    /** Festivos nacionales + Canarias para un año (fijos + Semana Santa). */
    private List<DiaFestivo> festivosDe(int y) {
        List<DiaFestivo> l = new ArrayList<>();
        // fijos nacionales y autonómicos
        l.add(new DiaFestivo(fecha(y, 1, 1), "Año Nuevo"));
        l.add(new DiaFestivo(fecha(y, 1, 6), "Reyes"));
        l.add(new DiaFestivo(fecha(y, 5, 1), "Día del Trabajo"));
        l.add(new DiaFestivo(fecha(y, 5, 30), "Día de Canarias"));
        l.add(new DiaFestivo(fecha(y, 8, 15), "Asunción"));
        l.add(new DiaFestivo(fecha(y, 10, 12), "Fiesta Nacional"));
        l.add(new DiaFestivo(fecha(y, 11, 1), "Todos los Santos"));
        l.add(new DiaFestivo(fecha(y, 12, 6), "Constitución"));
        l.add(new DiaFestivo(fecha(y, 12, 8), "Inmaculada"));
        l.add(new DiaFestivo(fecha(y, 12, 25), "Navidad"));
        // Semana Santa (móvil): Jueves y Viernes Santo
        LocalDate pascua = domingoPascua(y);
        l.add(new DiaFestivo(pascua.minusDays(3), "Jueves Santo"));
        l.add(new DiaFestivo(pascua.minusDays(2), "Viernes Santo"));
        return l;
    }

    private static LocalDate fecha(int y, int m, int d) { return LocalDate.of(y, m, d); }

    /** Domingo de Resurrección (algoritmo de Meeus/Butcher, calendario gregoriano). */
    static LocalDate domingoPascua(int y) {
        int a = y % 19, b = y / 100, c = y % 100, d = b / 4, e = b % 4;
        int f = (b + 8) / 25, g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30, i = c / 4, k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7, m = (a + 11 * h + 22 * l) / 451;
        int mes = (h + l - 7 * m + 114) / 31, dia = ((h + l - 7 * m + 114) % 31) + 1;
        return LocalDate.of(y, mes, dia);
    }

    // util para Navidad especial (fechas fijas) usado por TarifaService
    public static boolean esMonthDay(LocalDate d, int mes, int dia) {
        return MonthDay.of(mes, dia).equals(MonthDay.of(d.getMonthValue(), d.getDayOfMonth()));
    }
}
