package com.roommate.p2p_roommate.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
    @NotBlank(message = "First name cannot be blank")
    @Size(max = 100)
    String firstName,

    @NotBlank(message = "Last name cannot be blank")
    @Size(max = 100)
    String lastName,

    @Size(max = 30)
    String phoneNumber,

    @Size(max = 512)
    String profilePictureUrl,

    String bio
) {
    
}
