package com.taya.dto.request;
import com.taya.model.Rol;
import jakarta.validation.constraints.*;
/**
 * Los mensajes van escritos a mano y no se dejan por defecto: los de Bean
 * Validation salen en inglés ("must not be blank") y el usuario los ve tal cual
 * en pantalla. Están en castellano — es el idioma de la mayoría de altas; para
 * traducirlos habría que localizar los mensajes en el servidor.
 *
 * aceptaPrivacidad: consentimiento explícito exigido por el RGPD (art. 7).
 * Validado en el SERVIDOR, no solo con la casilla del formulario: un control
 * que se salta llamando a la API no es consentimiento, es decoración. Lleva
 * @NotNull ADEMÁS de @AssertTrue porque Bean Validation da por bueno un null
 * en @AssertTrue — sin él bastaba con omitir el campo para saltárselo.
 */
public record RegisterRequest(
    @NotBlank(message = "Escribe tu nombre") String nombre,
    @Email(message = "El correo no es válido") @NotBlank(message = "Escribe tu correo") String email,
    @NotBlank(message = "Escribe una contraseña")
    @Size(min = 6, message = "La contraseña necesita al menos 6 caracteres") String password,
    @NotNull(message = "Elige si viajas o conduces") Rol rol,
    String licencia, String vehiculoMatricula, String vehiculoModelo, String telefono,
    @NotNull(message = "Debes aceptar la política de privacidad para registrarte")
    @AssertTrue(message = "Debes aceptar la política de privacidad para registrarte")
    Boolean aceptaPrivacidad) {}
