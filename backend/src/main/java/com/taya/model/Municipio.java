package com.taya.model;

/**
 * Municipio de la licencia de taxi. La licencia es MUNICIPAL: un taxista solo
 * puede prestar servicio que ARRANCA en su municipio, y cada municipio fija su
 * propia tarifa urbana. Por eso el municipio manda en dos sitios:
 *
 *   1. Matching — un viaje que empieza en un municipio solo se ofrece a
 *      taxistas con licencia de ese municipio.
 *   2. Tarifa urbana — se aplica la del municipio donde empieza el viaje.
 *
 * DESCONOCIDO cubre las cuentas anteriores a este campo y las licencias cuyo
 * municipio no se puede deducir: se tratan sin filtro de municipio (como antes)
 * hasta que se les asigne uno, para no dejar a nadie sin viajes de golpe.
 */
public enum Municipio {
    LAS_PALMAS,
    SAN_BARTOLOME,
    DESCONOCIDO
}
