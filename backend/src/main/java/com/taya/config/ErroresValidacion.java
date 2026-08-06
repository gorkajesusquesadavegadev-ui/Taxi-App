package com.taya.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Convierte los fallos de validación en un mensaje que una persona entienda.
 *
 * Por defecto Spring devuelve "Validation failed for object='registerRequest'.
 * Error count: 1", que en pantalla no le dice NADA al usuario: no sabe qué
 * campo está mal ni qué hacer. Con la casilla de consentimiento del RGPD esto
 * dejó de ser cosmético — quien no la marcaba veía un error incomprensible y
 * no podía registrarse sin saber por qué.
 *
 * Se devuelve el mensaje del primer error (los formularios se corrigen de uno
 * en uno) y, si son varios, se listan.
 */
@RestControllerAdvice
public class ErroresValidacion {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validacion(MethodArgumentNotValidException e) {
        String mensaje = e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getDefaultMessage() != null && !f.getDefaultMessage().isBlank()
                ? f.getDefaultMessage()
                : f.getField() + ": valor no válido")
            .distinct()
            .reduce((a, b) -> a + ". " + b)
            .orElse("Revisa los datos del formulario");
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, mensaje);
    }
}
