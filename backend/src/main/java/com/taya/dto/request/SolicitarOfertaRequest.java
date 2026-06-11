package com.taya.dto.request;
import jakarta.validation.constraints.NotBlank;

/** recogidaLat/Lng opcionales: si faltan se usa el punto de recogida del catálogo. */
public record SolicitarOfertaRequest(@NotBlank String ofertaId,
                                     Double recogidaLat, Double recogidaLng) {}
