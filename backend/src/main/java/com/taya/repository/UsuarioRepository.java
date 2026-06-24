package com.taya.repository;
import com.taya.model.Rol;
import com.taya.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRol(Rol rol);
    List<Usuario> findByRolOrderByCreadoEnDesc(Rol rol);
    List<Usuario> findByRolAndVerificadoFalseOrderByCreadoEnDesc(Rol rol);
    // Taxistas disponibles para PUSH (persistente, no caduca al cerrar la app).
    List<Usuario> findByRolAndDisponibleTrue(Rol rol);
}
