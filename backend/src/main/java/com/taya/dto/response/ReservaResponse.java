package com.taya.dto.response;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Reserva para el frontend. Incluye datos de contacto del "otro" según quién
 * consulta: el cliente ve al taxista (y su WhatsApp), el taxista ve al cliente.
 */
public record ReservaResponse(
    Long id, String tipo, String detalle, String estado,
    double origenLat, double origenLng, double destinoLat, double destinoLng,
    String origenTexto, String destinoTexto,
    Instant programadaPara, BigDecimal precioEstimado, BigDecimal distanciaKm, String notas,
    Long clienteId, String clienteNombre, String clienteTelefono,
    Long taxistaId, String taxistaNombre, String taxistaTelefono) {}
