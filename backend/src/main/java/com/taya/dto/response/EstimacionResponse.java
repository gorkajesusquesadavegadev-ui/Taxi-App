package com.taya.dto.response;
import java.math.BigDecimal;
import java.util.List;
// ruta: road polyline as a list of [lat,lng] points so the client draws the
// real street path instead of a straight line. duracionMin: OSRM driving time.
// suplementos: detalle legible de los suplementos oficiales YA incluidos en
// precioEstimado (p.ej. "Radiotaxi 0,60€"), para que el cliente vea por qué
// el precio no es solo bandera+km — transparencia total, cero sorpresas.
//
// precioMin/precioMax: HORQUILLA que se enseña al cliente en vez de una cifra
// exacta. En un taxi manda el taxímetro, y el importe final depende del tráfico,
// de las esperas en semáforos y de la ruta concreta que haga el conductor —
// cosas que ninguna app puede predecir. Prometer un número exacto era prometer
// algo que no se controla; un rango es lo honesto y lo que de verdad se puede
// sostener. precioEstimado se mantiene como valor de referencia interno
// (estadísticas, histórico, cálculo del propio rango).
public record EstimacionResponse(BigDecimal distanciaKm, BigDecimal duracionMin,
                                 BigDecimal precioEstimado,
                                 BigDecimal precioMin, BigDecimal precioMax,
                                 List<double[]> ruta, String zona,
                                 String suplementos) {}
