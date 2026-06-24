package com.taya.dto.request;
import jakarta.validation.constraints.NotNull;
public record SolicitarViajeRequest(@NotNull Double origenLat, @NotNull Double origenLng,
    @NotNull Double destinoLat, @NotNull Double destinoLng,
    String origenTexto, String destinoTexto, Boolean requiereAccesible) {}
