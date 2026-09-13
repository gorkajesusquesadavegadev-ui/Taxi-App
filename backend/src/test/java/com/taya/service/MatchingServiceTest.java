package com.taya.service;
import com.taya.model.Usuario;
import com.taya.model.Viaje;
import com.taya.repository.UsuarioRepository;
import com.taya.websocket.TripWsService;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class MatchingServiceTest {

    private Usuario taxistaApto(Long id) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setVerificado(true);
        u.setBloqueado(false);
        // Los viajes de prueba salen de (28.1,-15.4) = Las Palmas, así que el
        // taxista debe ser de Las Palmas para poder recibirlos (la licencia es
        // municipal). Sin municipio no recibiría un viaje de un municipio conocido.
        u.setMunicipioLicencia(com.taya.model.Municipio.LAS_PALMAS);
        return u;
    }

    @Test void difunde_a_libres_verificados_y_conectados() {
        UbicacionService ubic = mock(UbicacionService.class);
        TarifaService tarifa = mock(TarifaService.class);
        TripWsService ws = mock(TripWsService.class);
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        WebPushService push = mock(WebPushService.class);

        when(tarifa.radioBusquedaKm()).thenReturn(new BigDecimal("5"));
        when(ubic.libresEnRadio(28.1, -15.4, 5.0)).thenReturn(List.of(
            new UbicacionService.TaxiCercano(7L, 28.1, -15.4)));
        when(ubic.tienePing(7L)).thenReturn(true); // conectado (presencia global)
        when(usuarios.findById(7L)).thenReturn(Optional.of(taxistaApto(7L)));
        when(usuarios.findByRolAndDisponibleTrue(any())).thenReturn(List.of());

        MatchingService m = new MatchingService(ubic, tarifa, ws, usuarios, push);
        Viaje v = new Viaje(); v.setId(1L); v.setOrigenLat(28.1); v.setOrigenLng(-15.4);
        m.difundirNuevoViaje(v);

        verify(ws).enviarNuevoViaje(eq(List.of(7L)), eq(v));
    }

    @Test void taxista_sin_ping_es_limpiado_como_fantasma() {
        UbicacionService ubic = mock(UbicacionService.class);
        TarifaService tarifa = mock(TarifaService.class);
        TripWsService ws = mock(TripWsService.class);
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        WebPushService push = mock(WebPushService.class);

        when(tarifa.radioBusquedaKm()).thenReturn(new BigDecimal("5"));
        when(ubic.libresEnRadio(anyDouble(), anyDouble(), anyDouble())).thenReturn(List.of(
            new UbicacionService.TaxiCercano(7L, 28.1, -15.4)));
        when(ubic.tienePing(7L)).thenReturn(false); // sin señal: fantasma
        when(usuarios.findById(7L)).thenReturn(Optional.of(taxistaApto(7L)));
        when(usuarios.findByRolAndDisponibleTrue(any())).thenReturn(List.of());

        MatchingService m = new MatchingService(ubic, tarifa, ws, usuarios, push);
        Viaje v = new Viaje(); v.setId(1L); v.setOrigenLat(28.1); v.setOrigenLng(-15.4);
        m.difundirNuevoViaje(v);

        // Sin ping, la sesión libre se considera fantasma y se limpia de Redis.
        verify(ubic, atLeastOnce()).setDesconectado(7L);
    }
}
