package com.roommate.p2p_roommate.domain.user.dto;

import com.roommate.p2p_roommate.domain.user.enums.UserRole;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank String idToken,
        UserRole role
) {
}
