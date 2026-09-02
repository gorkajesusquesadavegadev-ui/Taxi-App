package com.taya.service;
import com.taya.model.EstadoViaje;
import com.taya.model.Rol;
import com.taya.model.Usuario;
import com.taya.model.Viaje;
import com.taya.repository.UsuarioRepository;
import com.taya.repository.ViajeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AdminService {
    private final UsuarioRepository usuarios;
    private final ViajeRepository viajes;
    private final UbicacionService ubicacion;

    public AdminService(UsuarioRepository usuarios, ViajeRepository viajes, UbicacionService ubicacion) {
        this.usuarios = usuarios; this.viajes = viajes; this.ubicacion = ubicacion;
    }

    public record UsuarioAdmin(Long id, String nombre, String email, String telefono, String rol,
        boolean verificado, boolean bloqueado, double ratingMedia, int ratingCount,
        String licencia, String municipio, String matricula, String modelo, String documentoUrl, Instant creadoEn) {}

    public record ViajeAdmin(Long id, String estado, Long clienteId, Long taxistaId,
        String origen, String destino, BigDecimal precio, String tipo, Instant solicitadoEn) {}

    public record Metricas(long totalUsuarios, long totalClientes, long totalTaxistas,
        long taxistasPendientes, long taxistasOnline, long viajesHoy, long viajesCompletados,
        long viajesCancelados, BigDecimal ingresosTotales) {}

    private UsuarioAdmin toAdmin(Usuario u) {
        return new UsuarioAdmin(u.getId(), u.getNombre(), u.getEmail(), u.getTelefono(), u.getRol().name(),
            u.isVerificado(), u.isBloqueado(), u.getRatingMedia(), u.getRatingCount(),
            u.getLicencia(), u.getMunicipioLicencia().name(), u.getVehiculoMatricula(), u.getVehiculoModelo(), u.getDocumentoUrl(), u.getCreadoEn());
    }

    public List<UsuarioAdmin> usuarios() {
        return usuarios.findAll().stream()
            .sorted((a, b) -> b.getCreadoEn().compareTo(a.getCreadoEn()))
            .map(this::toAdmin).toList();
    }

    public List<UsuarioAdmin> taxistasPendientes() {
        return usuarios.findByRolAndVerificadoFalseOrderByCreadoEnDesc(Rol.TAXISTA).stream()
            .map(this::toAdmin).toList();
    }

    @Transactional
    public void verificar(Long id, boolean verificado) {
        Usuario u = usuarios.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "usuario no existe"));
        u.setVerificado(verificado);
        usuarios.save(u);
    }

    @Transactional
    public void asignarMunicipio(Long id, com.taya.model.Municipio municipio) {
        Usuario u = usuarios.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "usuario no existe"));
        if (u.getRol() != Rol.TAXISTA)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "solo los taxistas tienen municipio de licencia");
        u.setMunicipioLicencia(municipio);
        usuarios.save(u);
    }

    @Transactional
    public void bloquear(Long id, boolean bloqueado) {
        Usuario u = usuarios.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "usuario no existe"));
        if (u.getRol() == Rol.ADMIN)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no se puede bloquear a un admin");
        u.setBloqueado(bloqueado);
        usuarios.save(u);
    }

    public List<ViajeAdmin> viajesRecientes() {
        return viajes.findTop100ByOrderBySolicitadoEnDesc().stream().map(v -> new ViajeAdmin(
            v.getId(), v.getEstado().name(), v.getClienteId(), v.getTaxistaId(),
            v.getOrigenTexto(), v.getDestinoTexto(),
            v.getPrecioFinal() != null ? v.getPrecioFinal() : v.getPrecioEstimado(),
            v.getTipo() != null ? v.getTipo().name() : "NORMAL", v.getSolicitadoEn())).toList();
    }

    public Metricas metricas() {
        Instant inicioHoy = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long viajesHoy = viajes.findBySolicitadoEnAfter(inicioHoy).size();
        BigDecimal ingresos = viajes.findAll().stream()
            .filter(v -> v.getEstado() == EstadoViaje.COMPLETADO && v.getPrecioFinal() != null)
            .map(Viaje::getPrecioFinal).reduce(BigDecimal.ZERO, BigDecimal::add);
        long online = ubicacion.idsOnline() != null ? ubicacion.idsOnline().size() : 0;
        return new Metricas(
            usuarios.count(),
            usuarios.countByRol(Rol.CLIENTE),
            usuarios.countByRol(Rol.TAXISTA),
            usuarios.findByRolAndVerificadoFalseOrderByCreadoEnDesc(Rol.TAXISTA).size(),
            online,
            viajesHoy,
            viajes.countByEstado(EstadoViaje.COMPLETADO),
            viajes.countByEstado(EstadoViaje.CANCELADO),
            ingresos);
    }
}
