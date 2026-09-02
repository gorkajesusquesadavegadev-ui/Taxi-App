package com.taya.util;

import com.taya.model.Municipio;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

/** Deducción del municipio: del texto de la licencia y de las coordenadas. */
class MunicipiosTest {

    @Test void licencia_con_LPA_es_las_palmas() {
        assertEquals(Municipio.LAS_PALMAS, Municipios.deLicencia("LPA-123"));
        assertEquals(Municipio.LAS_PALMAS, Municipios.deLicencia("licencia las palmas 45"));
    }

    @Test void licencia_de_san_bartolome_por_varias_claves() {
        assertEquals(Municipio.SAN_BARTOLOME, Municipios.deLicencia("SBT-7"));
        assertEquals(Municipio.SAN_BARTOLOME, Municipios.deLicencia("Tirajana 12"));
        assertEquals(Municipio.SAN_BARTOLOME, Municipios.deLicencia("MASPALOMAS 3"));
    }

    @Test void licencia_sin_pista_queda_desconocida() {
        assertEquals(Municipio.DESCONOCIDO, Municipios.deLicencia("1234"));
        assertEquals(Municipio.DESCONOCIDO, Municipios.deLicencia(null));
    }

    @Test void punto_en_el_centro_de_las_palmas() {
        assertEquals(Municipio.LAS_PALMAS, Municipios.dePunto(28.123, -15.432));
    }

    @Test void punto_en_maspalomas_es_san_bartolome() {
        assertEquals(Municipio.SAN_BARTOLOME, Municipios.dePunto(27.7606, -15.5860)); // Maspalomas
        assertEquals(Municipio.SAN_BARTOLOME, Municipios.dePunto(27.7500, -15.5700)); // Playa del Inglés
    }

    @Test void punto_en_otra_zona_de_la_isla_queda_desconocido() {
        assertEquals(Municipio.DESCONOCIDO, Municipios.dePunto(28.4827, -16.3415)); // Tenerife
        assertEquals(Municipio.DESCONOCIDO, Municipios.dePunto(27.9319, -15.3866)); // Aeropuerto GC (ni casco LPA ni SBT)
    }
}
