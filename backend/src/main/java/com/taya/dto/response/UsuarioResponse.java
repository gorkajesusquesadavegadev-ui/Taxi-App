package com.taya.dto.response;
public record UsuarioResponse(Long id, String nombre, String email, String rol,
    String vehiculoMatricula, String vehiculoModelo, String telefono) {}
