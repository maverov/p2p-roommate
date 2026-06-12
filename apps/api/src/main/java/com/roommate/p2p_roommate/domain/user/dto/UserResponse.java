package com.roommate.p2p_roommate.domain.user.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.roommate.p2p_roommate.domain.user.enums.UserRole;

public record UserResponse(
    UUID id,
    String email,
    String name,
    String phoneNumber,
    UserRole role,
    boolean isVerified,
    String profilePictureUrl,
    String bio,
    OffsetDateTime createdAt
) {
    
}
