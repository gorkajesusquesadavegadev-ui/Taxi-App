package com.taya.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

/**
 * Traduce cualquier fallo del backend a algo que una persona pueda leer.
 *
 * El motivo es concreto: se estaban viendo por pantalla los mensajes internos
 * de las excepciones. Al intentar iniciar sesión aparecían cosas como
 * «must not be blank», «JSON parse error: Unexpected end-of-input
 * within/between Object entries» o «Content-Type 'application/x-www-form-
 * urlencoded' is not supported» — texto de Jackson y de Bean Validation, en
 * inglés, delante de un usuario que solo quería entrar.
 *
 * La causa era `server.error.include-message=always` en application.properties:
 * metía el mensaje crudo de la excepción en la respuesta. Estaba puesto para
 * que el frontend tuviera ALGO que enseñar, porque sin él Spring devuelve un
 * cuerpo vacío de información. La solución no es quitarlo y quedarse sin
 * mensaje, sino escribir aquí el mensaje de cada caso.
 *
 * Regla: el usuario ve una frase útil en su idioma; el detalle técnico va al
 * log del servidor, que es donde sirve para depurar.
 */
@RestControllerAdvice
public class ErroresApi {

    private static final Logger log = LoggerFactory.getLogger(ErroresApi.class);

    private static ProblemDetail problema(HttpStatus estado, String mensaje) {
        return ProblemDetail.forStatusAndDetail(estado, mensaje);
    }

    /**
     * Errores de validación de formulario. Se devuelve el mensaje del primer
     * campo mal (los formularios se corrigen de uno en uno); si hay varios, se
     * encadenan. Los DTO llevan los textos en castellano — un `@NotBlank` sin
     * `message` acaba enseñando «must not be blank», que fue justo el fallo.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validacion(MethodArgumentNotValidException e) {
        String mensaje = e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getDefaultMessage() != null && !f.getDefaultMessage().isBlank()
                ? f.getDefaultMessage()
                : "Revisa el campo " + f.getField())
            .distinct()
            .reduce((a, b) -> a + ". " + b)
            .orElse("Revisa los datos del formulario");
        return problema(HttpStatus.BAD_REQUEST, mensaje);
    }

    /**
     * JSON ilegible o un enum que no existe (por ejemplo rol "PILOTO"). Antes
     * salía el mensaje de Jackson con la posición del carácter.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail cuerpoIlegible(HttpMessageNotReadableException e) {
        log.warn("Cuerpo de petición ilegible: {}", e.getMostSpecificCause().toString());
        return problema(HttpStatus.BAD_REQUEST,
            "No hemos podido leer los datos enviados. Revisa el formulario e inténtalo de nuevo.");
    }

    /**
     * La base de datos rechaza el dato (columna demasiado corta, restricción
     * única, campo obligatorio a null).
     *
     * Este es el que provocó la fuga que reportó un usuario al registrarse: el
     * mensaje de Hibernate para un fallo así incluye la sentencia INSERT
     * completa, es decir el nombre de las 23 columnas de la tabla de usuarios
     * —password_hash entre ellas— y a veces la fila que falló con sus valores.
     * Con server.error.include-message=always aquello viajaba tal cual al
     * navegador de quien se estaba dando de alta.
     *
     * Los DTO ya validan longitudes para que no se llegue hasta aquí; esto es
     * la segunda barrera, por si aparece una restricción que nadie previó.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail conflictoDeDatos(DataIntegrityViolationException e) {
        log.error("Restricción de base de datos violada", e);
        return problema(HttpStatus.CONFLICT,
            "No hemos podido guardar esos datos. Revisa el formulario e inténtalo de nuevo.");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail tipoIncorrecto(MethodArgumentTypeMismatchException e) {
        log.warn("Parámetro con tipo incorrecto: {}", e.getMessage());
        return problema(HttpStatus.BAD_REQUEST, "Alguno de los datos enviados no tiene el formato esperado.");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ProblemDetail faltaParametro(MissingServletRequestParameterException e) {
        log.warn("Falta parámetro obligatorio: {}", e.getParameterName());
        return problema(HttpStatus.BAD_REQUEST, "Faltan datos en la petición.");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ProblemDetail formatoNoSoportado(HttpMediaTypeNotSupportedException e) {
        log.warn("Content-Type no soportado: {}", e.getContentType());
        return problema(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "El formato de la petición no es válido.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ProblemDetail metodoNoSoportado(HttpRequestMethodNotSupportedException e) {
        return problema(HttpStatus.METHOD_NOT_ALLOWED, "Esa operación no está disponible.");
    }

    /**
     * Las que lanzamos nosotros a propósito (credenciales, cuenta bloqueada,
     * email repetido…). El texto ya está escrito para el usuario, así que se
     * respeta; si alguna viniera sin motivo, se pone uno genérico según el
     * código en vez de dejar la pantalla en blanco.
     */
    @ExceptionHandler(ResponseStatusException.class)
    ProblemDetail deNegocio(ResponseStatusException e) {
        HttpStatus estado = HttpStatus.resolve(e.getStatusCode().value());
        if (estado == null) estado = HttpStatus.INTERNAL_SERVER_ERROR;
        String motivo = e.getReason();
        if (motivo == null || motivo.isBlank()) motivo = porDefecto(estado);
        if (estado.is5xxServerError()) log.error("Error de servidor devuelto al cliente", e);
        return problema(estado, motivo);
    }

    /** Un 403 de seguridad no debe convertirse en un 500 por el catch-all. */
    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail accesoDenegado(AccessDeniedException e) {
        return problema(HttpStatus.FORBIDDEN, "No tienes permiso para hacer esto.");
    }

    /**
     * Red de seguridad. Cualquier fallo no previsto sale como un mensaje
     * neutro: el usuario no tiene por qué ver una traza, y una traza en
     * pantalla además revela cómo está construido el backend. El error real,
     * completo, queda en el log del servidor.
     */
    @ExceptionHandler(Exception.class)
    ProblemDetail inesperado(Exception e) {
        log.error("Error no controlado", e);
        return problema(HttpStatus.INTERNAL_SERVER_ERROR,
            "Algo ha fallado por nuestra parte. Inténtalo de nuevo en unos segundos.");
    }

    private static String porDefecto(HttpStatus estado) {
        return switch (estado) {
            case UNAUTHORIZED -> "Necesitas iniciar sesión.";
            case FORBIDDEN    -> "No tienes permiso para hacer esto.";
            case NOT_FOUND    -> "No hemos encontrado lo que buscas.";
            case CONFLICT     -> "Esa operación no se puede completar ahora mismo.";
            default           -> estado.is4xxClientError()
                ? "Revisa los datos e inténtalo de nuevo."
                : "Algo ha fallado por nuestra parte. Inténtalo de nuevo en unos segundos.";
        };
    }
}
