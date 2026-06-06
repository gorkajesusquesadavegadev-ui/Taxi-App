package com.taya.util;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class GeoUtilTest {
    @Test void haversineKmEntrePuertoYAeropuerto() {
        // Puerto de la Luz -> Aeropuerto GC, ~ 22 km straight line
        double km = GeoUtil.haversineKm(28.1333, -15.4333, 27.9319, -15.3866);
        assertThat(km).isBetween(20.0, 26.0);
    }
}
