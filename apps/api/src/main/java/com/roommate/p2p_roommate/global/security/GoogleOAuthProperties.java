package com.roommate.p2p_roommate.global.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

@Validated
@ConfigurationProperties(prefix = "application.security.google")
public record GoogleOAuthProperties(
    @NotBlank String clientId
) {
    
}
