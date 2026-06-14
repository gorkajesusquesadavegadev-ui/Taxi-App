package com.taya.dto.request;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/**
 * tipo: NORMAL | TRANSFER | EXCURSION. Para ofertas basta ofertaId (+ recogida
 * opcional). Para normal hacen falta origen y destino. programadaPara en UTC.
 */
public record CrearReservaRequest(
    @NotNull String tipo, String ofertaId,
    Double origenLat, Double origenLng, String origenTexto,
    Double destinoLat, Double destinoLng, String destinoTexto,
    @NotNull Instant programadaPara, String notas) {}
