package com.taya.dto.response;
import com.taya.model.Viaje;
import com.taya.util.PrecioUtil;
import java.math.BigDecimal;
import java.time.Instant;
public record ViajeResponse(Long id, Long clienteId, Long taxistaId, String estado,
    double origenLat, double origenLng, double destinoLat, double destinoLng,
    BigDecimal distanciaEstimadaKm, BigDecimal precioEstimado,
    BigDecimal distanciaRealKm, BigDecimal precioFinal, String tipo, String detalle,
    String origenTexto, String destinoTexto, Instant solicitadoEn, Instant completadoEn,
    String taxistaNombre, String taxistaTelefono, String clienteNombre, String clienteTelefono,
    String taxistaMatricula, String taxistaModelo, String taxistaLicencia,
    Double taxistaRating, Integer taxistaRatingCount, Boolean taxistaVerificado,
    // Horquilla mostrada al cliente en vez de una cifra exacta: el importe
    // real lo marca el taxímetro (tráfico, esperas, ruta concreta).
    BigDecimal precioMin, BigDecimal precioMax) {

    public static ViajeResponse of(Viaje v) {
        return of(v, null, null, null, null, null, null, null, null, null, null);
    }

    /** Con datos de contacto (nombre/teléfono) para el historial. */
    public static ViajeResponse of(Viaje v, String taxistaNombre, String taxistaTelefono,
                                   String clienteNombre, String clienteTelefono) {
        return of(v, taxistaNombre, taxistaTelefono, clienteNombre, clienteTelefono, null, null, null, null, null, null);
    }

    /** Con contacto + vehículo + reputación del taxista para el cliente. */
    public static ViajeResponse of(Viaje v, String taxistaNombre, String taxistaTelefono,
                                   String clienteNombre, String clienteTelefono,
                                   String taxistaMatricula, String taxistaModelo, String taxistaLicencia,
                                   Double taxistaRating, Integer taxistaRatingCount, Boolean taxistaVerificado) {
        // La horquilla es derivada, no un parámetro: siempre sale del precio
        // que lleve el viaje, así no puede quedar descuadrada.
        BigDecimal[] rango = PrecioUtil.horquilla(
            v.getPrecioFinal() != null ? v.getPrecioFinal() : v.getPrecioEstimado());
        return new ViajeResponse(v.getId(), v.getClienteId(), v.getTaxistaId(), v.getEstado().name(),
            v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng(),
            v.getDistanciaEstimadaKm(), v.getPrecioEstimado(), v.getDistanciaRealKm(), v.getPrecioFinal(),
            v.getTipo() != null ? v.getTipo().name() : "NORMAL", v.getDetalle(),
            v.getOrigenTexto(), v.getDestinoTexto(), v.getSolicitadoEn(), v.getCompletadoEn(),
            taxistaNombre, taxistaTelefono, clienteNombre, clienteTelefono,
            taxistaMatricula, taxistaModelo, taxistaLicencia,
            taxistaRating, taxistaRatingCount, taxistaVerificado,
            rango[0], rango[1]);
    }
}
