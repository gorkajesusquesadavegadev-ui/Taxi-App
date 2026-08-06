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
     * Ancho de la horquilla: 5 € por encima del precio calculado, igual para
     * todos los trayectos. Se eligió un importe fijo en vez de un porcentaje
     * porque es lo que el cliente entiende de un vistazo ("entre 33 y 38") y no
     * hace que un trayecto largo muestre un abanico enorme.
     */
    private static final BigDecimal MARGEN_FIJO = new BigDecimal("5");

    /**
     * @return [min, max] en euros ENTEROS, o [null, null] si no hay precio.
     *   El suelo es el precio calculado TRUNCADO (mejor caso: sin una sola
     *   parada); el techo, 5 € más. Enteros porque una horquilla con céntimos
     *   ("33,87 – 38,87 €") fingiría justo la precisión que no se tiene.
     */
    public static BigDecimal[] horquilla(BigDecimal precio) {
        if (precio == null) return new BigDecimal[]{null, null};
        BigDecimal min = precio.setScale(0, RoundingMode.FLOOR);
        return new BigDecimal[]{min, min.add(MARGEN_FIJO)};
    }
}
