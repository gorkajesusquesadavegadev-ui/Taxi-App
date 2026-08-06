package com.taya.util;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Horquilla de precio que se enseña al cliente ("entre 34 y 40 €") en lugar de
 * una cifra exacta.
 *
 * En un taxi manda el taxímetro: el importe final depende del tráfico, de las
 * esperas en semáforos y de la ruta concreta que haga el conductor. Ninguna app
 * puede predecir eso, así que dar un número al céntimo era prometer algo que no
 * se controla. El rango es lo que de verdad se puede sostener.
 *
 * Vive aquí, y no en TarifaService, porque lo necesitan tanto la estimación
 * previa como la respuesta de un viaje ya creado: una sola definición del rango
 * para que no puedan divergir.
 */
public final class PrecioUtil {
    private PrecioUtil() {}

    /**
     * Margen superior. El cálculo por kilómetro supone circulación fluida y ruta
     * óptima; en la calle hay atascos y esperas, y el taxímetro sigue corriendo
     * parado (la hora de espera son 17-20 € según franja). Un 15% cubre esa
     * variabilidad sin inflar la estimación hasta hacerla inútil.
     */
    private static final BigDecimal MARGEN_SUPERIOR = new BigDecimal("1.15");

    /**
     * @return [min, max] en euros ENTEROS, o [null, null] si no hay precio.
     *   El suelo es el precio calculado redondeado a la baja (mejor caso: sin
     *   una sola parada); el techo, un 15% más redondeado al alza. Enteros
     *   porque una horquilla con céntimos ("33,87 – 39,54 €") finge justo la
     *   precisión que no se tiene.
     */
    public static BigDecimal[] horquilla(BigDecimal precio) {
        if (precio == null) return new BigDecimal[]{null, null};
        BigDecimal min = precio.setScale(0, RoundingMode.FLOOR);
        BigDecimal max = precio.multiply(MARGEN_SUPERIOR).setScale(0, RoundingMode.CEILING);
        // Trayectos muy cortos: evita un rango degenerado del tipo "5 – 5 €".
        if (max.compareTo(min) <= 0) max = min.add(BigDecimal.ONE);
        return new BigDecimal[]{min, max};
    }
}
