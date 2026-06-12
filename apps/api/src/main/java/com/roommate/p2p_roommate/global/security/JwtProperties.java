package com.roommate.p2p_roommate.global.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Validated
@ConfigurationProperties(prefix = "application.security.jwt")
public record JwtProperties(
    @NotBlank(message = "JWT Secret Key must be explicitly set via environment configuration.")
    @Size(min = 43, message = "JWT Secret Key must be sufficiently long to guarantee HS256 encryption security.")
    String secretKey,

    @NotNull(message = "JWT Expiration window duration must be specified")
    Long expiration
) {}
