package com.taya.dto.request;
import com.taya.model.Rol;
import jakarta.validation.constraints.*;
public record RegisterRequest(
    @NotBlank String nombre, @Email @NotBlank String email,
    @NotBlank @Size(min = 6) String password, @NotNull Rol rol,
    String licencia, String vehiculoMatricula, String vehiculoModelo, String telefono) {}
