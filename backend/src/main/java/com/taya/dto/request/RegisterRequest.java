package com.taya.dto.request;
import com.taya.model.Rol;
import jakarta.validation.constraints.*;
/**
 * aceptaPrivacidad: consentimiento explícito exigido por el RGPD (art. 7). Va
 * validado en el servidor con @AssertTrue y no solo con la casilla del
 * formulario: una casilla que se puede saltar llamando a la API no es
 * consentimiento, es decoración. Lleva @NotNull ADEMÁS de @AssertTrue
 * porque Bean Validation da por válido un null en @AssertTrue: sin el
 * @NotNull bastaría con omitir el campo para saltarse el consentimiento.
 */
public record RegisterRequest(
    @NotBlank String nombre, @Email @NotBlank String email,
    @NotBlank @Size(min = 6) String password, @NotNull Rol rol,
    String licencia, String vehiculoMatricula, String vehiculoModelo, String telefono,
    @NotNull @AssertTrue(message = "Debes aceptar la política de privacidad") Boolean aceptaPrivacidad) {}
