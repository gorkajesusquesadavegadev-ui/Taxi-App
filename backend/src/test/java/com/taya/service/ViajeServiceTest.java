package com.taya.service;
import com.taya.model.*;
import com.taya.repository.ViajeRepository;
import com.taya.websocket.TripWsService;
import org.junit.jupiter.api.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ViajeServiceTest {
    ViajeRepository viajes; TarifaService tarifa; UbicacionService ubicacion;
    MatchingService matching; TripWsService ws; ViajeService service;

    @BeforeEach void setup() {
        viajes = mock(ViajeRepository.class);
        tarifa = mock(TarifaService.class);
        ubicacion = mock(UbicacionService.class);
        matching = mock(MatchingService.class);
        ws = mock(TripWsService.class);
        service = new ViajeService(viajes, tarifa, ubicacion, matching, ws);
    }

    @Test void llegada_requiereEstadoAceptado() {
        Viaje v = new Viaje(); v.setId(1L); v.setTaxistaId(7L); v.setEstado(EstadoViaje.SOLICITADO);
        when(viajes.findById(1L)).thenReturn(Optional.of(v));
        assertThatThrownBy(() -> service.llegada(1L, 7L))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("409");
    }

    @Test void finalizar_calculaPrecioFinalYliberaTaxi() {
        Viaje v = new Viaje(); v.setId(1L); v.setTaxistaId(7L); v.setEstado(EstadoViaje.EN_CURSO);
        when(viajes.findById(1L)).thenReturn(Optional.of(v));
        when(tarifa.precioFinal(4.0)).thenReturn(new java.math.BigDecimal("4.70"));
        when(viajes.save(any())).thenAnswer(i -> i.getArgument(0));
        var resp = service.finalizar(1L, 7L, 4.0);
        assertThat(resp.estado()).isEqualTo("COMPLETADO");
        assertThat(resp.precioFinal()).isEqualByComparingTo("4.70");
        verify(ubicacion).setLibre(eq(7L), anyDouble(), anyDouble());
    }
}
