package com.taya.service;
import com.taya.dto.request.*;
import com.taya.dto.response.AuthResponse;
import com.taya.model.Usuario;
import com.taya.repository.UsuarioRepository;
import com.taya.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;
    public AuthService(UsuarioRepository u, PasswordEncoder e, JwtTokenProvider j) {
        this.usuarios = u; this.encoder = e; this.jwt = j;
    }

    public AuthResponse register(RegisterRequest r) {
        if (usuarios.existsByEmail(r.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email ya registrado");
        Usuario u = new Usuario();
        u.setNombre(r.nombre()); u.setEmail(r.email());
        u.setPasswordHash(encoder.encode(r.password())); u.setRol(r.rol());
        u.setLicencia(r.licencia()); u.setVehiculoMatricula(r.vehiculoMatricula());
        u.setVehiculoModelo(r.vehiculoModelo()); u.setTelefono(r.telefono());
        u = usuarios.save(u);
        return new AuthResponse(jwt.generate(u.getId(), u.getRol().name()), u.getId(), u.getNombre(), u.getRol().name());
    }

    public AuthResponse login(LoginRequest r) {
        Usuario u = usuarios.findByEmail(r.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "credenciales inválidas"));
        if (!encoder.matches(r.password(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "credenciales inválidas");
        return new AuthResponse(jwt.generate(u.getId(), u.getRol().name()), u.getId(), u.getNombre(), u.getRol().name());
    }
}
