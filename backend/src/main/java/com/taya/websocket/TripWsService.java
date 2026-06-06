package com.taya.websocket;
import com.taya.model.Viaje;
import java.util.List;
public interface TripWsService {
    void enviarNuevoViaje(List<Long> taxistaIds, Viaje viaje);
    void enviarAceptado(Long clienteId, Viaje viaje);
    void enviarTomado(List<Long> taxistaIds, Long viajeId);
    void enviarUbicacionTaxi(Long clienteId, double lat, double lng);
    void enviarLlegada(Long clienteId, Long viajeId);
    void enviarEstado(Long clienteId, String status);
    void enviarCancelado(Long clienteId, Long taxistaId, Long viajeId);
}
