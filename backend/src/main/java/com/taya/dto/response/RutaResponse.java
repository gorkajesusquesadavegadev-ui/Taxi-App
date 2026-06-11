package com.taya.dto.response;
import java.math.BigDecimal;
import java.util.List;

/** Ruta por calles de un viaje: polilínea [lat,lng] + distancia y duración. */
public record RutaResponse(List<double[]> puntos, BigDecimal km, BigDecimal duracionMin) {}
