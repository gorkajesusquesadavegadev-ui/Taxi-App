package com.taya.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Los rangos de latitud/longitud no son decoración: sin ellos, unas
 * coordenadas absurdas (lat 9999) daban una ruta de miles de kilómetros y un
 * precio de cinco cifras en vez de un error. Canarias entra de sobra en
 * lat 27–30 / lng -19..-13, pero se admite el rango terrestre completo para no
 * atarse a la geografía y aun así descartar valores imposibles.
 *
 * Los textos llevan tope de longitud por lo mismo que en el registro: sin él,
 * un texto larguísimo llega hasta la columna de la base de datos y revienta
 * allí. Los mensajes van escritos, que si no Bean Validation responde en
 * inglés y eso es lo que ve el usuario.
 */
public record SolicitarViajeRequest(
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
    @Size(max = 200, message = "La dirección de recogida es demasiado larga") String origenTexto,
    @Size(max = 200, message = "La dirección de destino es demasiado larga") String destinoTexto,
    Boolean requiereAccesible,
    double[][] paradas) {}
