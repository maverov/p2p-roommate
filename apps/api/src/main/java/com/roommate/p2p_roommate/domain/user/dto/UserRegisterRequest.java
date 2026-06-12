package com.roommate.p2p_roommate.domain.user.dto;

import com.roommate.p2p_roommate.domain.user.enums.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserRegisterRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255)
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    String password,

    @NotBlank(message = "Name is required")
    @Size(max = 200)
    String name,

    @Size(max = 30)
    String phoneNumber,

    @NotNull(message = "Role is required")
    UserRole role
) {
    
}
