package com.taya.dto.request;
import jakarta.validation.constraints.NotNull;
public record EstimarRequest(@NotNull Double origenLat, @NotNull Double origenLng,
    @NotNull Double destinoLat, @NotNull Double destinoLng) {}
