package com.taya.dto.response;
/**
 * requiereConsentimiento: true cuando la cuenta se creo ANTES de que existiera
 * la casilla de aceptacion, asi que no hay constancia de que aceptara la
 * politica de privacidad. El art. 7.1 del RGPD exige poder acreditar el
 * consentimiento, y para esas cuentas no se puede. La app pide aceptar antes
 * de dejar seguir usandola, y a partir de ahi queda registrado.
 */
public record UsuarioResponse(Long id, String nombre, String email, String rol,
    String vehiculoMatricula, String vehiculoModelo, String telefono,
    boolean verificado, double ratingMedia, int ratingCount, String licencia,
    boolean vehiculoAccesible, boolean requiereConsentimiento) {}
