package com.taya.dto.response;
import java.math.BigDecimal;
import java.util.List;
// ruta: road polyline as a list of [lat,lng] points so the client draws the
// real street path instead of a straight line.
public record EstimacionResponse(BigDecimal distanciaKm, BigDecimal precioEstimado, List<double[]> ruta) {}
