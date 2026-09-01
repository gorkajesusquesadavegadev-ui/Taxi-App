package com.taya.service;

import com.taya.dto.request.RegisterRequest;
import com.taya.model.Rol;
import com.taya.model.Usuario;
import com.taya.repository.UsuarioRepository;
import com.taya.security.IntentosLogin;
import com.taya.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Registro público — quién puede crear qué.
 *
 * Aquí vivía una vulnerabilidad crítica: el rol se cogía del cuerpo de la
 * petición y se guardaba tal cual, así que cualquiera enviando {"rol":"ADMIN"}
 * se creaba una cuenta de administrador y entraba en el panel. Estos tests
 * fijan que el registro público solo pueda crear CLIENTE o TAXISTA.
 */
class AuthServiceRegistroTest {

    private UsuarioRepository usuarios;
    private AuthService auth;

    @BeforeEach void montar() {
        usuarios = mock(UsuarioRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JwtTokenProvider jwt = mock(JwtTokenProvider.class);
        when(usuarios.existsByEmail(anyString())).thenReturn(false);
        when(encoder.encode(anyString())).thenReturn("$2a$hash");
        when(jwt.generate(any(), anyString())).thenReturn("token-de-prueba");
        when(usuarios.save(any(Usuario.class))).thenAnswer(i -> {
            Usuario u = i.getArgument(0);
            u.setId(1L);
            return u;
        });
        auth = new AuthService(usuarios, encoder, jwt, mock(IntentosLogin.class), "");
    }

    private RegisterRequest alta(Rol rol) {
        return new RegisterRequest("Nom", "a@b.com", "Abcd1234!", rol,
            null, null, null, null, true);
    }

    @Test void un_cliente_se_registra_como_cliente() {
        var r = auth.register(alta(Rol.CLIENTE));
        assertEquals("CLIENTE", r.rol());
    }

    @Test void un_taxista_se_registra_como_taxista() {
        assertEquals("TAXISTA", auth.register(alta(Rol.TAXISTA)).rol());
    }

    @Test void NO_se_puede_registrar_un_ADMIN() {
        var e = assertThrows(ResponseStatusException.class, () -> auth.register(alta(Rol.ADMIN)));
        assertEquals(400, e.getStatusCode().value());
        // Y sobre todo: no se llega a guardar nada.
        verify(usuarios, never()).save(any());
    }

    @Test void el_email_repetido_da_conflicto() {
        when(usuarios.existsByEmail("a@b.com")).thenReturn(true);
        var e = assertThrows(ResponseStatusException.class, () -> auth.register(alta(Rol.CLIENTE)));
        assertEquals(409, e.getStatusCode().value());
    }

    @Test void un_alta_valida_queda_con_el_consentimiento_registrado() {
        auth.register(alta(Rol.CLIENTE));
        var captor = org.mockito.ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).save(captor.capture());
        Usuario guardado = captor.getValue();
        assertNotNull(guardado.getConsentimientoEn(), "debe quedar constancia de cuándo aceptó (RGPD 7.1)");
        assertEquals(AuthService.POLITICA_VERSION, guardado.getConsentimientoVersion());
        assertFalse(guardado.isVerificado(), "un taxista recién registrado NO puede salir verificado");
    }
}
