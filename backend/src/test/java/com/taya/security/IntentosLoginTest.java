package com.taya.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Freno de fuerza bruta por cuenta.
 *
 * El límite por IP no para a quien prueba contraseñas de una misma cuenta
 * repartiendo los intentos entre muchas direcciones. Esto sí, y por eso
 * conviene que su comportamiento esté fijado: un fallo aquí no se nota
 * mirando la pantalla, se nota cuando alguien entra en una cuenta ajena.
 */
class IntentosLoginTest {

    private StringRedisTemplate redis;
    private ValueOperations<String, String> ops;
    private IntentosLogin intentos;

    @BeforeEach void montar() {
        redis = mock(StringRedisTemplate.class);
        ops = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(ops);
        intentos = new IntentosLogin(redis);
    }

    @Test void sin_fallos_previos_deja_pasar() {
        when(ops.get(anyString())).thenReturn(null);
        assertDoesNotThrow(() -> intentos.comprobar("a@b.com"));
    }

    @Test void por_debajo_del_limite_deja_pasar() {
        when(ops.get(anyString())).thenReturn("5");
        assertDoesNotThrow(() -> intentos.comprobar("a@b.com"));
    }

    @Test void al_llegar_al_limite_corta() {
        when(ops.get(anyString())).thenReturn("6");
        when(redis.getExpire(anyString())).thenReturn(600L);
        var e = assertThrows(ResponseStatusException.class, () -> intentos.comprobar("a@b.com"));
        assertEquals(429, e.getStatusCode().value());
        assertTrue(e.getReason().contains("10 minutos"), "debe decir cuánto falta: " + e.getReason());
    }

    @Test void el_mensaje_concuerda_en_singular() {
        when(ops.get(anyString())).thenReturn("9");
        when(redis.getExpire(anyString())).thenReturn(60L);
        var e = assertThrows(ResponseStatusException.class, () -> intentos.comprobar("a@b.com"));
        assertTrue(e.getReason().contains("1 minuto e"), e.getReason());
    }

    @Test void el_correo_no_se_guarda_en_claro() {
        when(ops.increment(anyString())).thenReturn(1L);
        intentos.fallo("Victima@Ejemplo.com");
        var captor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(ops).increment(captor.capture());
        String clave = captor.getValue();
        assertFalse(clave.toLowerCase().contains("victima"), "la clave no puede llevar el correo: " + clave);
        assertTrue(clave.startsWith("login:fallos:"));
    }

    @Test void mayusculas_y_espacios_cuentan_como_la_misma_cuenta() {
        when(ops.increment(anyString())).thenReturn(1L);
        intentos.fallo("  Pepe@X.com ");
        intentos.fallo("pepe@x.com");
        var captor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(ops, times(2)).increment(captor.capture());
        assertEquals(captor.getAllValues().get(0), captor.getAllValues().get(1),
            "si no, bastaría cambiar una mayúscula para saltarse el freno");
    }

    @Test void el_primer_fallo_pone_caducidad() {
        when(ops.increment(anyString())).thenReturn(1L);
        intentos.fallo("a@b.com");
        verify(redis).expire(anyString(), any(Duration.class));
    }

    @Test void los_siguientes_fallos_no_reinician_la_ventana() {
        when(ops.increment(anyString())).thenReturn(3L);
        intentos.fallo("a@b.com");
        // Si se renovara la caducidad en cada intento, la ventana no expiraría
        // nunca mientras el atacante siguiera probando.
        verify(redis, never()).expire(anyString(), any(Duration.class));
    }

    @Test void entrar_bien_borra_el_contador() {
        intentos.acierto("a@b.com");
        verify(redis).delete(anyString());
    }

    @Test void si_redis_falla_no_se_bloquea_a_nadie() {
        when(ops.get(anyString())).thenThrow(new RuntimeException("redis caído"));
        assertDoesNotThrow(() -> intentos.comprobar("a@b.com"),
            "una caída de la caché no puede dejar a todos fuera");
    }

    @Test void si_redis_falla_al_contar_tampoco_revienta_el_login() {
        when(ops.increment(anyString())).thenThrow(new RuntimeException("redis caído"));
        assertDoesNotThrow(() -> intentos.fallo("a@b.com"));
        assertDoesNotThrow(() -> intentos.acierto("a@b.com"));
    }
}
