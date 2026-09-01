package com.taya.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** recogidaLat/Lng opcionales: si faltan se usa el punto de recogida del catálogo.
 *  Con valor, se acota igual que en el resto de peticiones con coordenadas. */
public record SolicitarOfertaRequest(
    @NotBlank(message = "Falta la oferta") @Size(max = 100, message = "Oferta no válida") String ofertaId,
    @DecimalMin(value = "-90", message = "Coordenada no válida") @DecimalMax(value = "90", message = "Coordenada no válida")
    Double recogidaLat,
    @DecimalMin(value = "-180", message = "Coordenada no válida") @DecimalMax(value = "180", message = "Coordenada no válida")
    Double recogidaLng) {}
