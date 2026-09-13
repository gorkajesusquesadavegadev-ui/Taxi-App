package com.taya.service;

import com.taya.model.Municipio;
import com.taya.model.Usuario;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Regla de matching por municipio (licencia municipal).
 *
 * Un taxista SOLO recibe viajes que salen de su municipio. Un viaje de una zona
 * que el sistema no modela como municipio propio (aeropuerto, resto de la isla)
 * lo puede coger cualquiera. Un taxista SIN municipio asignado NO recibe viajes
 * de los municipios conocidos —esto es lo que fallaba: un taxista de Las Palmas
 * (y también uno sin asignar) recibía un viaje que salía de Maspalomas.
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

    @Test void un_taxista_de_san_bartolome_atiende_viaje_de_san_bartolome() {
        assertTrue(MatchingService.atiende(taxista(Municipio.SAN_BARTOLOME), Municipio.SAN_BARTOLOME));
    }

    // --- El caso ilegal que hay que impedir ---

    @Test void un_taxista_de_las_palmas_NO_atiende_viaje_de_san_bartolome() {
        assertFalse(MatchingService.atiende(taxista(Municipio.LAS_PALMAS), Municipio.SAN_BARTOLOME));
    }

    @Test void un_taxista_de_san_bartolome_NO_atiende_viaje_de_las_palmas() {
        assertFalse(MatchingService.atiende(taxista(Municipio.SAN_BARTOLOME), Municipio.LAS_PALMAS));
    }

    /**
     * Regresión exacta del fallo reportado: un taxista SIN municipio asignado
     * NO puede recibir un viaje que sale de un municipio conocido. Antes sí lo
     * recibía (la regla dejaba pasar a los DESCONOCIDO), y por eso a un taxista
     * de Las Palmas sin asignar le llegó un viaje de Maspalomas.
     */
    @Test void un_taxista_SIN_municipio_NO_recibe_viajes_de_san_bartolome() {
        assertFalse(MatchingService.atiende(taxista(Municipio.DESCONOCIDO), Municipio.SAN_BARTOLOME));
    }

    @Test void un_taxista_SIN_municipio_NO_recibe_viajes_de_las_palmas() {
        assertFalse(MatchingService.atiende(taxista(Municipio.DESCONOCIDO), Municipio.LAS_PALMAS));
    }

    // --- Zona sin municipio modelado: aeropuerto, resto de la isla ---

    @Test void un_viaje_de_zona_sin_municipio_lo_puede_coger_cualquiera() {
        assertTrue(MatchingService.atiende(taxista(Municipio.LAS_PALMAS), Municipio.DESCONOCIDO));
        assertTrue(MatchingService.atiende(taxista(Municipio.SAN_BARTOLOME), Municipio.DESCONOCIDO));
        assertTrue(MatchingService.atiende(taxista(Municipio.DESCONOCIDO), Municipio.DESCONOCIDO));
    }
}
