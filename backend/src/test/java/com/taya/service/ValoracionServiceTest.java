package com.taya.service;
import com.taya.model.EstadoViaje;
import com.taya.model.Viaje;
import com.taya.repository.UsuarioRepository;
import com.taya.repository.ValoracionRepository;
import com.taya.repository.ViajeRepository;
import org.junit.jupiter.api.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.mockito.Mockito.*;

class ValoracionServiceTest {
    ValoracionRepository valoraciones; ViajeRepository viajes; UsuarioRepository usuarios;
    ValoracionService service;

    @BeforeEach void setup() {
        valoraciones = mock(ValoracionRepository.class);
        viajes = mock(ViajeRepository.class);
        usuarios = mock(UsuarioRepository.class);
        service = new ValoracionService(valoraciones, viajes, usuarios);
    }

    private Viaje completado() {
        Viaje v = new Viaje(); v.setId(1L); v.setClienteId(5L); v.setTaxistaId(7L);
        v.setEstado(EstadoViaje.COMPLETADO);
        return v;
    }

    @Test void rechaza_estrellas_fuera_de_rango() {
        Assertions.assertThrows(ResponseStatusException.class,
            () -> service.valorar(1L, 5L, 6, null));
        Assertions.assertThrows(ResponseStatusException.class,
            () -> service.valorar(1L, 5L, 0, null));
    }

    @Test void rechaza_si_viaje_no_completado() {
        Viaje v = completado(); v.setEstado(EstadoViaje.EN_CURSO);
        when(viajes.findById(1L)).thenReturn(Optional.of(v));
        Assertions.assertThrows(ResponseStatusException.class,
            () -> service.valorar(1L, 5L, 5, "bien"));
    }

    @Test void rechaza_si_no_participaste() {
        when(viajes.findById(1L)).thenReturn(Optional.of(completado()));
        Assertions.assertThrows(ResponseStatusException.class,
            () -> service.valorar(1L, 999L, 5, null));
    }

    @Test void rechaza_doble_valoracion() {
        when(viajes.findById(1L)).thenReturn(Optional.of(completado()));
        when(valoraciones.existsByViajeIdAndAutorId(1L, 5L)).thenReturn(true);
        Assertions.assertThrows(ResponseStatusException.class,
            () -> service.valorar(1L, 5L, 5, null));
    }

    @Test void cliente_valora_al_taxista_ok() {
        when(viajes.findById(1L)).thenReturn(Optional.of(completado()));
        when(valoraciones.existsByViajeIdAndAutorId(1L, 5L)).thenReturn(false);
        when(valoraciones.mediaDe(7L)).thenReturn(4.5);
        when(valoraciones.countDe(7L)).thenReturn(2L);
        when(usuarios.findById(7L)).thenReturn(Optional.empty());

        service.valorar(1L, 5L, 5, "genial");

        verify(valoraciones).save(any());
    }
}
