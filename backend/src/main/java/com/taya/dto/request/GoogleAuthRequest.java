package com.taya.dto.request;
import jakarta.validation.constraints.*;
public record GoogleAuthRequest(@NotBlank String idToken) {}
