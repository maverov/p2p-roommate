package com.roommate.p2p_roommate.domain.user.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roommate.p2p_roommate.domain.user.dto.UserResponse;
import com.roommate.p2p_roommate.domain.user.dto.UserUpdateRequest;
import com.roommate.p2p_roommate.domain.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse getCurrentUser() {
        return userService.getCurrentUser();
    }

    @PatchMapping("/me")
    public UserResponse updateCurrentUser(@Valid @RequestBody UserUpdateRequest request) {
        return userService.updateCurrenUser(request);
    }
}
