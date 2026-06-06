package com.taya.service;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.*;
import org.testcontainers.containers.*;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest @Testcontainers
class UbicacionServiceIT {
    @Container @ServiceConnection static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");
    @Container static GenericContainer<?> redis = new GenericContainer<>("redis:7.2-alpine").withExposedPorts(6379);
    @DynamicPropertySource static void props(DynamicPropertyRegistry r) {
        r.add("spring.data.redis.host", redis::getHost);
        r.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
    @Autowired UbicacionService ubicacion;

    @Test void libresEnRadioDevuelveTaxiCercano() {
        ubicacion.setLibre(1L, 28.1333, -15.4333);   // puerto
        ubicacion.setLibre(2L, 27.9319, -15.3866);   // aeropuerto (~22 km)
        var cerca = ubicacion.libresEnRadio(28.1333, -15.4333, 5.0);
        assertThat(cerca).extracting(UbicacionService.TaxiCercano::taxistaId).containsExactly(1L);
    }
}
