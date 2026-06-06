package com.taya.security;
import com.taya.repository.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UsuarioRepository usuarios;
    public CustomUserDetailsService(UsuarioRepository usuarios) { this.usuarios = usuarios; }

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        var u = usuarios.findById(Long.valueOf(userId))
            .orElseThrow(() -> new UsernameNotFoundException(userId));
        return new User(String.valueOf(u.getId()), u.getPasswordHash(),
            List.of(new SimpleGrantedAuthority("ROLE_" + u.getRol().name())));
    }
}
