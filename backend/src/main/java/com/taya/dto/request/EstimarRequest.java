package com.taya.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

// Mismo rango de coordenadas que en SolicitarViajeRequest: sin él, lat 9999
// devolvía una estimación de 12.000 km y 16.000 € en lugar de un error.
public record EstimarRequest(
    @NotNull(message = "Falta el punto de recogida")
    @DecimalMin(value = "-90", message = "Coordenada no válida") @DecimalMax(value = "90", message = "Coordenada no válida")
    Double origenLat,
    @NotNull(message = "Falta el punto de recogida")
    @DecimalMin(value = "-180", message = "Coordenada no válida") @DecimalMax(value = "180", message = "Coordenada no válida")
    Double origenLng,
    @NotNull(message = "Falta el destino")
    @DecimalMin(value = "-90", message = "Coordenada no válida") @DecimalMax(value = "90", message = "Coordenada no válida")
    Double destinoLat,
    @NotNull(message = "Falta el destino")
    @DecimalMin(value = "-180", message = "Coordenada no válida") @DecimalMax(value = "180", message = "Coordenada no válida")
    Double destinoLng,
    double[][] paradas) {}
