package com.taya.controller;

import com.taya.config.ErroresApi;
import com.taya.service.ValoracionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Validación de entrada en endpoints que la tenían escrita pero no aplicada:
 * faltaba el @Valid en el controlador, así que @Min/@Max/@Size del DTO no se
 * comprobaban. El caso con impacto real es la valoración: sin el tope, un
 * cliente podía enviar 1000 estrellas y descuadrar la media de un taxista.
 */
class ValidacionEntradaTest {

    private ValoracionService valoraciones;
    private MockMvc mvc;

    @BeforeEach void montar() {
        valoraciones = mock(ValoracionService.class);
        // @AuthenticationPrincipal no se resuelve solo en standalone; se
        // inyecta el id "1" para que el caso válido no falle por eso.
        var principal = new org.springframework.web.method.support.HandlerMethodArgumentResolver() {
            public boolean supportsParameter(org.springframework.core.MethodParameter p) {
                return p.hasParameterAnnotation(org.springframework.security.core.annotation.AuthenticationPrincipal.class);
            }
            public Object resolveArgument(org.springframework.core.MethodParameter p,
                    org.springframework.web.method.support.ModelAndViewContainer m,
                    org.springframework.web.context.request.NativeWebRequest w,
                    org.springframework.web.bind.support.WebDataBinderFactory f) { return "1"; }
        };
        mvc = MockMvcBuilders
            .standaloneSetup(new ValoracionController(valoraciones))
            .setControllerAdvice(new ErroresApi())
            .setCustomArgumentResolvers(principal)
            .build();
    }

    private org.springframework.test.web.servlet.ResultActions valorar(String cuerpo) throws Exception {
        return mvc.perform(post("/api/valoraciones/1").contentType(MediaType.APPLICATION_JSON).content(cuerpo));
    }

    @Test void una_valoracion_de_1_a_5_pasa() throws Exception {
        valorar("{\"estrellas\":5,\"comentario\":\"Genial\"}").andExpect(status().isOk());
        verify(valoraciones).valorar(eq(1L), any(), eq(5), anyString());
    }

    @Test void mil_estrellas_se_rechazan_y_no_llegan_al_servicio() throws Exception {
        valorar("{\"estrellas\":1000}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail").value("La valoración va de 1 a 5"));
        verify(valoraciones, never()).valorar(anyLong(), any(), anyInt(), any());
    }

    @Test void cero_estrellas_tambien() throws Exception {
        valorar("{\"estrellas\":0}").andExpect(status().isBadRequest());
        verify(valoraciones, never()).valorar(anyLong(), any(), anyInt(), any());
    }

    @Test void estrellas_negativas_tambien() throws Exception {
        valorar("{\"estrellas\":-3}").andExpect(status().isBadRequest());
        verify(valoraciones, never()).valorar(anyLong(), any(), anyInt(), any());
    }

    @Test void un_comentario_larguisimo_se_frena_antes_de_la_bd() throws Exception {
        String largo = "x".repeat(2000);
        valorar("{\"estrellas\":5,\"comentario\":\"" + largo + "\"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail").value("El comentario es demasiado largo"));
        verify(valoraciones, never()).valorar(anyLong(), any(), anyInt(), any());
    }
}
