package com.taya;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.*;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import com.jayway.jsonpath.JsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @Testcontainers
class ViajeFlowIT {
    @Container @ServiceConnection static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");
    @Container static GenericContainer<?> redis = new GenericContainer<>("redis:7.2-alpine").withExposedPorts(6379);
    @DynamicPropertySource static void props(DynamicPropertyRegistry r) {
        r.add("spring.data.redis.host", redis::getHost);
        r.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
    @Autowired MockMvc mvc;

    private String token(String email, String rol) throws Exception {
        String body = "{\"nombre\":\"x\",\"email\":\"" + email + "\",\"password\":\"secret1\",\"rol\":\"" + rol + "\"}";
        String resp = mvc.perform(post("/api/auth/register").contentType("application/json").content(body))
            .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resp, "$.token");
    }

    @Test void clientRequestsTaxistaCompletes() throws Exception {
        String cliente = token("c1@taya.com","CLIENTE");
        String taxista = token("t1@taya.com","TAXISTA");

        // taxista goes free near origin
        mvc.perform(put("/api/taxista/estado").header("Authorization","Bearer "+taxista)
            .contentType("application/json").content("{\"estado\":\"LIBRE\",\"lat\":28.1,\"lng\":-15.4}"))
            .andExpect(status().isOk());

        // client requests
        String solBody = "{\"origenLat\":28.1,\"origenLng\":-15.4,\"destinoLat\":28.0,\"destinoLng\":-15.4}";
        String sol = mvc.perform(post("/api/viajes/solicitar").header("Authorization","Bearer "+cliente)
            .contentType("application/json").content(solBody))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        int viajeId = JsonPath.read(sol, "$.id");

        // accept -> llegada -> iniciar -> finalizar
        mvc.perform(put("/api/viajes/"+viajeId+"/aceptar").header("Authorization","Bearer "+taxista)).andExpect(status().isOk());
        mvc.perform(put("/api/viajes/"+viajeId+"/llegada").header("Authorization","Bearer "+taxista)).andExpect(status().isOk());
        mvc.perform(put("/api/viajes/"+viajeId+"/iniciar").header("Authorization","Bearer "+taxista)).andExpect(status().isOk());
        mvc.perform(put("/api/viajes/"+viajeId+"/finalizar").header("Authorization","Bearer "+taxista)
            .contentType("application/json").content("{\"distanciaReal\":4.0}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("COMPLETADO"))
            .andExpect(jsonPath("$.precioFinal").exists());
    }
}
