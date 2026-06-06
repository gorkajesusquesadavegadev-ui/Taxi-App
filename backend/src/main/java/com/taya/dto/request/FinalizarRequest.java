package com.taya.dto.request;
import jakarta.validation.constraints.*;
public record FinalizarRequest(@NotNull @Positive Double distanciaReal) {}
