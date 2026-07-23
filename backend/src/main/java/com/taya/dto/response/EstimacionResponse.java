package com.taya.dto.response;
import java.math.BigDecimal;
import java.util.List;
// ruta: road polyline as a list of [lat,lng] points so the client draws the
// real street path instead of a straight line. duracionMin: OSRM driving time.
// suplementos: detalle legible de los suplementos oficiales YA incluidos en
// precioEstimado (p.ej. "Radiotaxi 0,60€"), para que el cliente vea por qué
// el precio no es solo bandera+km — transparencia total, cero sorpresas.
public record EstimacionResponse(BigDecimal distanciaKm, BigDecimal duracionMin,
                                 BigDecimal precioEstimado, List<double[]> ruta, String zona,
                                 String suplementos) {}
