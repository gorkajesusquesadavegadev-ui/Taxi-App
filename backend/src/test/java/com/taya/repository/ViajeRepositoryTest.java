package com.taya.repository;
import com.taya.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class ViajeRepositoryTest {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");

    @Autowired ViajeRepository viajes;

    @Test
    void aceptarSiDisponible_soloPrimeroGana() {
        Viaje v = new Viaje();
        v.setClienteId(1L); v.setOrigenLat(28.1); v.setOrigenLng(-15.4);
        v.setDestinoLat(28.0); v.setDestinoLng(-15.4);
        v = viajes.save(v);

        int first = viajes.aceptarSiDisponible(v.getId(), 10L, java.time.Instant.now());
        int second = viajes.aceptarSiDisponible(v.getId(), 20L, java.time.Instant.now());

        assertThat(first).isEqualTo(1);
        assertThat(second).isEqualTo(0);
        assertThat(viajes.findById(v.getId()).get().getTaxistaId()).isEqualTo(10L);
    }
}
