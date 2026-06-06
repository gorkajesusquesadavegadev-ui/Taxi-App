package com.taya.security;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {
    JwtTokenProvider provider = new JwtTokenProvider(
        "devSecretChangeMeToA32+ByteRandomValue000", 86400000L);

    @Test
    void generaYValidaToken() {
        String token = provider.generate(42L, "TAXISTA");
        assertThat(provider.isValid(token)).isTrue();
        assertThat(provider.getUserId(token)).isEqualTo(42L);
        assertThat(provider.getRol(token)).isEqualTo("TAXISTA");
    }

    @Test
    void tokenManipuladoEsInvalido() {
        assertThat(provider.isValid("garbage.token.value")).isFalse();
    }
}
