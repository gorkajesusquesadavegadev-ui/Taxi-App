package com.taya.service;
import com.taya.model.Viaje;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.mockito.Mockito.*;

class MatchingServiceTest {
    @Test void difundir_seleccionaLibresEnRadioYNotifica() {
        UbicacionService ubic = mock(UbicacionService.class);
        TarifaService tarifa = mock(TarifaService.class);
        com.taya.websocket.TripWsService ws = mock(com.taya.websocket.TripWsService.class);
        when(tarifa.radioBusquedaKm()).thenReturn(new BigDecimal("5"));
        when(ubic.libresEnRadio(28.1,-15.4,5.0)).thenReturn(List.of(
            new UbicacionService.TaxiCercano(7L, 28.1, -15.4)));

        MatchingService m = new MatchingService(ubic, tarifa, ws);
        Viaje v = new Viaje(); v.setId(1L); v.setOrigenLat(28.1); v.setOrigenLng(-15.4);
        m.difundirNuevoViaje(v);

        verify(ws).enviarNuevoViaje(eq(List.of(7L)), eq(v));
    }
}
