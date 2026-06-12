package com.roommate.p2p_roommate.domain.user.dto;

public record AuthResponse(
    String accessToken,
    UserResponse user
) {
    
}
