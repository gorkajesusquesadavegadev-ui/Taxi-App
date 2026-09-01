package com.taya.dto.request;
import com.taya.model.Rol;
import jakarta.validation.constraints.*;
/**
 * Los mensajes van escritos a mano y no se dejan por defecto: los de Bean
 * Validation salen en inglés ("must not be blank") y el usuario los ve tal cual
 * en pantalla. Están en castellano — es el idioma de la mayoría de altas; para
 * traducirlos habría que localizar los mensajes en el servidor.
 *
 * Los máximos existen para que un campo demasiado largo se rechace AQUÍ, con
 * un mensaje que se entiende, y no reviente contra la columna de la base de
 * datos. Cuando reventaba abajo, la respuesta de error llevaba la sentencia
 * INSERT completa de Hibernate: los nombres de las 23 columnas de la tabla de
 * usuarios, password_hash incluida, servidos a quien se estaba registrando.
 *
 * aceptaPrivacidad: consentimiento explícito exigido por el RGPD (art. 7).
 * Validado en el SERVIDOR, no solo con la casilla del formulario: un control
 * que se salta llamando a la API no es consentimiento, es decoración. Lleva
 * @NotNull ADEMÁS de @AssertTrue porque Bean Validation da por bueno un null
 * en @AssertTrue — sin él bastaba con omitir el campo para saltárselo.
 */
public record RegisterRequest(
    @NotBlank(message = "Escribe tu nombre")
    @Size(max = 60, message = "El nombre es demasiado largo") String nombre,

    @Email(message = "El correo no es válido") @NotBlank(message = "Escribe tu correo")
    @Size(max = 150, message = "El correo es demasiado largo") String email,

    @NotBlank(message = "Escribe una contraseña")
    // El máximo no es capricho: bcrypt solo tiene en cuenta los primeros 72
    // bytes y recorta el resto sin avisar. Sin este límite, alguien con una
    // contraseña de 100 caracteres creería tener una que no tiene.
    @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres") String password,

    @NotNull(message = "Elige si viajas o conduces") Rol rol,

    @Size(max = 30, message = "El número de licencia es demasiado largo") String licencia,
    @Size(max = 15, message = "La matrícula es demasiado larga") String vehiculoMatricula,
    @Size(max = 60, message = "El modelo del vehículo es demasiado largo") String vehiculoModelo,
    @Size(max = 20, message = "El teléfono es demasiado largo") String telefono,
    @NotNull(message = "Debes aceptar la política de privacidad para registrarte")
    @AssertTrue(message = "Debes aceptar la política de privacidad para registrarte")
    Boolean aceptaPrivacidad) {}
