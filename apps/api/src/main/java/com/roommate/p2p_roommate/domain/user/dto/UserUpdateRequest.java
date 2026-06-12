package com.roommate.p2p_roommate.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
    @NotBlank(message = "Name cannot be blank")
    @Size(max = 200)
    String name,

    @Size(max = 30)
    String phoneNumber,

    @Size(max = 512)
    String profilePictureUrl,

    String bio
) {
    
}
