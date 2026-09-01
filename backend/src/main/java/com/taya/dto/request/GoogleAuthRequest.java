package com.taya.dto.request;
import jakarta.validation.constraints.*;

public record GoogleAuthRequest(
    @NotBlank(message = "No hemos recibido la respuesta de Google. Inténtalo de nuevo.")
    String idToken) {}
