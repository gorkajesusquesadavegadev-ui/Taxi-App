package com.taya.service;

import com.taya.model.Municipio;
import com.taya.model.Usuario;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * La regla de matching por municipio: un taxista solo atiende viajes que salen
 * de su municipio, PERO si algún lado es desconocido se deja pasar (para no
 * dejar sin viajes a las cuentas anteriores al campo).
 */
class MatchingMunicipioTest {

    private Usuario taxista(Municipio m) {
        Usuario u = new Usuario();
        u.setMunicipioLicencia(m);
        return u;
    }

    @Test void un_taxista_de_las_palmas_atiende_viaje_de_las_palmas() {
        assertTrue(MatchingService.atiende(taxista(Municipio.LAS_PALMAS), Municipio.LAS_PALMAS));
    }

    @Test void un_taxista_de_las_palmas_NO_atiende_viaje_de_san_bartolome() {
        assertFalse(MatchingService.atiende(taxista(Municipio.LAS_PALMAS), Municipio.SAN_BARTOLOME));
    }

    @Test void un_taxista_de_san_bartolome_NO_atiende_viaje_de_las_palmas() {
        assertFalse(MatchingService.atiende(taxista(Municipio.SAN_BARTOLOME), Municipio.LAS_PALMAS));
    }

    @Test void un_taxista_sin_municipio_asignado_sigue_recibiendo_todo() {
        assertTrue(MatchingService.atiende(taxista(Municipio.DESCONOCIDO), Municipio.SAN_BARTOLOME));
        assertTrue(MatchingService.atiende(taxista(Municipio.DESCONOCIDO), Municipio.LAS_PALMAS));
    }

    @Test void un_viaje_de_zona_sin_municipio_lo_puede_coger_cualquiera() {
        // Ej. aeropuerto o interior de la isla: no es ni casco de LPA ni SBT.
        assertTrue(MatchingService.atiende(taxista(Municipio.LAS_PALMAS), Municipio.DESCONOCIDO));
        assertTrue(MatchingService.atiende(taxista(Municipio.SAN_BARTOLOME), Municipio.DESCONOCIDO));
    }
}
