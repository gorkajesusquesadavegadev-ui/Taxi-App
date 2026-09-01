package com.taya.config;

import com.taya.controller.AuthController;
import com.taya.dto.request.LoginRequest;
import com.taya.security.JwtTokenProvider;
import com.taya.security.TokenBlacklist;
import com.taya.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * El contrato de errores de la API: lo que ve el usuario cuando algo falla.
 *
 * Existe porque se estaban colando a la pantalla los mensajes internos de las
 * excepciones. Entrar con el correo vacío enseñaba «must not be blank»; un
 * cuerpo mal formado, «JSON parse error: Unexpected end-of-input within/between
 * Object entries». Aparte de ser incomprensible, una traza en pantalla enseña
 * cómo está montado el backend.
 *
 * Cada test comprueba las dos mitades: que sale una frase útil en castellano y
 * que NO sale el texto técnico que se colaba antes.
 */
class ErroresApiTest {

    private AuthService auth;
    private MockMvc mvc;

    @BeforeEach void montar() {
        auth = mock(AuthService.class);
        mvc = MockMvcBuilders
            .standaloneSetup(new AuthController(auth, mock(JwtTokenProvider.class), mock(TokenBlacklist.class)))
            .setControllerAdvice(new ErroresApi())
            .build();
    }

    private org.springframework.test.web.servlet.ResultActions login(String cuerpo) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo));
    }

    @Nested class ValidacionDeFormulario {

        @Test void correo_vacio_lo_dice_en_castellano() throws Exception {
            login("{\"email\":\"\",\"password\":\"Abcd1234!\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Escribe tu correo"));
        }

        @Test void correo_con_formato_malo() throws Exception {
            login("{\"email\":\"pepe\",\"password\":\"Abcd1234!\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Ese correo no parece válido"));
        }

        @Test void sin_contrasena() throws Exception {
            login("{\"email\":\"a@b.com\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Escribe tu contraseña"));
        }

        @Test void nunca_sale_el_texto_por_defecto_de_bean_validation() throws Exception {
            login("{\"email\":\"\",\"password\":\"\"}")
                .andExpect(jsonPath("$.detail", not(containsString("must not be blank"))))
                .andExpect(jsonPath("$.detail", not(containsString("must be a well-formed"))));
        }

        @Test void con_dos_campos_mal_se_mencionan_los_dos() throws Exception {
            login("{\"email\":\"\",\"password\":\"\"}")
                .andExpect(jsonPath("$.detail", containsString("correo")))
                .andExpect(jsonPath("$.detail", containsString("contraseña")));
        }
    }

    @Nested class PeticionMalFormada {

        @Test void json_roto_no_ensena_las_tripas_de_jackson() throws Exception {
            login("{\"email\":")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", not(containsString("JSON parse error"))))
                .andExpect(jsonPath("$.detail", not(containsString("Object entries"))))
                .andExpect(jsonPath("$.detail", containsString("No hemos podido leer los datos")));
        }

        @Test void enum_inexistente_tampoco() throws Exception {
            // rol "PILOTO" no existe: Jackson falla al deserializar.
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nombre\":\"A\",\"email\":\"a@b.com\",\"password\":\"Abcd1234!\","
                           + "\"rol\":\"PILOTO\",\"aceptaPrivacidad\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", not(containsString("PILOTO"))))
                .andExpect(jsonPath("$.detail", not(containsString("Cannot deserialize"))));
        }

        @Test void content_type_no_soportado_no_lo_detalla() throws Exception {
            mvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED).content("hola"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.detail", not(containsString("application/x-www-form-urlencoded"))));
        }
    }

    /**
     * La fuga que reportó un usuario al registrarse: veía en pantalla los
     * nombres de todas las columnas de la tabla. Venía del mensaje de
     * Hibernate, que incluye la sentencia INSERT entera.
     */
    @Nested class FugaDeEsquema {

        private static final String MENSAJE_REAL_DE_HIBERNATE =
            "could not execute statement [ERROR: value too long for type character varying(255)] "
          + "[insert into usuarios (bloqueado,consentimiento_en,consentimiento_version,creado_en,"
          + "disponible,email,google_sub,licencia,nombre,password_hash,rating_count,rating_media,"
          + "rol,telefono,vehiculo_accesible,vehiculo_matricula,vehiculo_modelo,verificado,id) "
          + "values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)]";

        private org.springframework.test.web.servlet.ResultActions registroQueRevienta() throws Exception {
            when(auth.register(any())).thenThrow(
                new org.springframework.dao.DataIntegrityViolationException(MENSAJE_REAL_DE_HIBERNATE));
            return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"A\",\"email\":\"a@b.com\",\"password\":\"Abcd1234!\","
                       + "\"rol\":\"CLIENTE\",\"aceptaPrivacidad\":true}"));
        }

        @Test void no_se_filtra_ni_una_columna_de_la_tabla() throws Exception {
            registroQueRevienta()
                .andExpect(jsonPath("$.detail", not(containsString("password_hash"))))
                .andExpect(jsonPath("$.detail", not(containsString("consentimiento"))))
                .andExpect(jsonPath("$.detail", not(containsString("google_sub"))))
                .andExpect(jsonPath("$.detail", not(containsString("usuarios"))))
                .andExpect(jsonPath("$.detail", not(containsString("insert into"))));
        }

        @Test void tampoco_el_tipo_ni_el_motor_de_la_base_de_datos() throws Exception {
            registroQueRevienta()
                .andExpect(jsonPath("$.detail", not(containsString("character varying"))))
                .andExpect(jsonPath("$.detail", not(containsString("could not execute"))));
        }

        @Test void el_usuario_recibe_algo_que_puede_entender() throws Exception {
            registroQueRevienta()
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail", containsString("No hemos podido guardar esos datos")));
        }

        @Test void un_nombre_larguisimo_se_frena_en_la_validacion_no_en_la_bd() throws Exception {
            // Si llega a la base de datos es que falta un @Size en el DTO.
            String largo = "A".repeat(400);
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nombre\":\"" + largo + "\",\"email\":\"a@b.com\","
                           + "\"password\":\"Abcd1234!\",\"rol\":\"CLIENTE\",\"aceptaPrivacidad\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("El nombre es demasiado largo"));
            verify(auth, never()).register(any());
        }

        @Test void una_matricula_larguisima_tampoco_llega_a_la_bd() throws Exception {
            String largo = "B".repeat(400);
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nombre\":\"A\",\"email\":\"a@b.com\",\"password\":\"Abcd1234!\","
                           + "\"rol\":\"TAXISTA\",\"vehiculoMatricula\":\"" + largo + "\","
                           + "\"aceptaPrivacidad\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("La matrícula es demasiado larga"));
            verify(auth, never()).register(any());
        }

        @Test void una_contrasena_mas_larga_que_bcrypt_se_rechaza_en_vez_de_recortarse() throws Exception {
            // bcrypt ignora todo lo que pase de 72 bytes. Sin este límite, el
            // usuario creería tener una contraseña de 100 caracteres.
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nombre\":\"A\",\"email\":\"a@b.com\",\"password\":\"" + "x".repeat(100)
                           + "\",\"rol\":\"CLIENTE\",\"aceptaPrivacidad\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("entre 6 y 72")));
            verify(auth, never()).register(any());
        }
    }

    @Nested class ErroresDeNegocio {

        @Test void credenciales_malas_conservan_su_mensaje_y_su_codigo() throws Exception {
            when(auth.login(any(LoginRequest.class))).thenThrow(
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos"));
            login("{\"email\":\"a@b.com\",\"password\":\"Abcd1234!\"}")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Correo o contraseña incorrectos"));
        }

        @Test void cuenta_bloqueada_da_403_con_su_texto() throws Exception {
            when(auth.login(any(LoginRequest.class))).thenThrow(
                new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu cuenta está bloqueada."));
            login("{\"email\":\"a@b.com\",\"password\":\"Abcd1234!\"}")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Tu cuenta está bloqueada."));
        }

        @Test void si_la_excepcion_viene_sin_motivo_no_deja_la_pantalla_en_blanco() throws Exception {
            when(auth.login(any(LoginRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
            login("{\"email\":\"a@b.com\",\"password\":\"Abcd1234!\"}")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Necesitas iniciar sesión."));
        }
    }

    @Nested class FalloInesperado {

        @Test void un_error_no_previsto_sale_como_mensaje_neutro() throws Exception {
            when(auth.login(any(LoginRequest.class)))
                .thenThrow(new IllegalStateException("connection pool exhausted at com.zaxxer.hikari"));
            login("{\"email\":\"a@b.com\",\"password\":\"Abcd1234!\"}")
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.detail").value(
                    "Algo ha fallado por nuestra parte. Inténtalo de nuevo en unos segundos."));
        }

        @Test void no_se_filtra_nada_del_error_interno() throws Exception {
            when(auth.login(any(LoginRequest.class)))
                .thenThrow(new NullPointerException("Cannot invoke getPasswordHash() because u is null"));
            login("{\"email\":\"a@b.com\",\"password\":\"Abcd1234!\"}")
                .andExpect(jsonPath("$.detail", not(containsString("NullPointer"))))
                .andExpect(jsonPath("$.detail", not(containsString("getPasswordHash"))))
                .andExpect(jsonPath("$.detail", not(containsString("com.taya"))));
        }
    }
}
