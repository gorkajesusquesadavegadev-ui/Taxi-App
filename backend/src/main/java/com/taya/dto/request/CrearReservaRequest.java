package com.taya.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/**
 * tipo: NORMAL | TRANSFER | EXCURSION. Para ofertas basta ofertaId (+ recogida
 * opcional). Para normal hacen falta origen y destino. programadaPara en UTC.
 *
 * Coordenadas acotadas y textos con tope, igual que en el resto de peticiones:
 * sin ello un texto largo llega a la columna y revienta, y una coordenada
 * imposible produce basura. Mensajes en castellano para no mostrar los de Bean
 * Validation en inglés.
 */
public record CrearReservaRequest(
    @NotNull(message = "Falta el tipo de reserva") @Size(max = 20, message = "Tipo no válido") String tipo,
    @Size(max = 100, message = "Oferta no válida") String ofertaId,
    @DecimalMin(value = "-90", message = "Coordenada no válida") @DecimalMax(value = "90", message = "Coordenada no válida") Double origenLat,
    @DecimalMin(value = "-180", message = "Coordenada no válida") @DecimalMax(value = "180", message = "Coordenada no válida") Double origenLng,
    @Size(max = 200, message = "La dirección de recogida es demasiado larga") String origenTexto,
    @DecimalMin(value = "-90", message = "Coordenada no válida") @DecimalMax(value = "90", message = "Coordenada no válida") Double destinoLat,
    @DecimalMin(value = "-180", message = "Coordenada no válida") @DecimalMax(value = "180", message = "Coordenada no válida") Double destinoLng,
    @Size(max = 200, message = "La dirección de destino es demasiado larga") String destinoTexto,
    @NotNull(message = "Falta la fecha de la reserva") Instant programadaPara,
    @Size(max = 500, message = "Las notas son demasiado largas") String notas) {}
