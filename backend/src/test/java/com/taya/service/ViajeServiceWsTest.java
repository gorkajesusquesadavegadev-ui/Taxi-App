package com.taya.service;
import com.taya.model.*;
import com.taya.repository.UsuarioRepository;
import com.taya.repository.ValoracionRepository;
import com.taya.repository.ViajeRepository;
import com.taya.websocket.TripWsService;
import org.junit.jupiter.api.*;
import java.util.Optional;
import static org.mockito.Mockito.*;

class ViajeServiceWsTest {
    ViajeRepository viajes; TarifaService tarifa; UbicacionService ubic;
    MatchingService matching; TripWsService ws; CatalogoService catalogo;
    OsrmClient osrm; GeocodingService geo; UsuarioRepository usuarios;
    ValoracionRepository valoraciones; ViajeService service;

    @BeforeEach void setup() {
        viajes = mock(ViajeRepository.class); tarifa = mock(TarifaService.class);
        ubic = mock(UbicacionService.class); matching = mock(MatchingService.class);
        ws = mock(TripWsService.class); catalogo = mock(CatalogoService.class);
        osrm = mock(OsrmClient.class); geo = mock(GeocodingService.class);
        usuarios = mock(UsuarioRepository.class); valoraciones = mock(ValoracionRepository.class);
        service = new ViajeService(viajes, tarifa, ubic, matching, ws, catalogo, osrm, geo, usuarios, valoraciones);
    }

    @Test void aceptar_emiteAcceptedAlCliente_yMarcaOcupado() {
        Viaje v = new Viaje(); v.setId(1L); v.setClienteId(5L); v.setTaxistaId(7L); v.setEstado(EstadoViaje.ACEPTADO);
        when(viajes.aceptarSiDisponible(eq(1L), eq(7L), any())).thenReturn(1);
        when(viajes.findById(1L)).thenReturn(Optional.of(v));
        when(usuarios.findById(any())).thenReturn(Optional.empty());

        service.aceptar(1L, 7L);

        verify(ws).enviarAceptado(eq(5L), any(Viaje.class));
        verify(ubic).setOcupado(7L);
    }

    @Test void aceptar_lanza409_siYaNoDisponible() {
        when(viajes.aceptarSiDisponible(eq(1L), eq(7L), any())).thenReturn(0);
        Assertions.assertThrows(org.springframework.web.server.ResponseStatusException.class,
            () -> service.aceptar(1L, 7L));
    }
}
