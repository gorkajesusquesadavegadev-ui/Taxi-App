package com.taya.dto.request;
import jakarta.validation.constraints.*;

// Los mensajes van escritos: sin ellos Bean Validation devuelve sus textos por
// defecto en inglés («must not be blank») y acaban en la pantalla del usuario.
public record LoginRequest(
    @NotBlank(message = "Escribe tu correo")
    @Email(message = "Ese correo no parece válido")
    String email,

    @NotBlank(message = "Escribe tu contraseña")
    String password) {}
