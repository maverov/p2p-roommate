package com.roommate.p2p_roommate.domain.user.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.roommate.p2p_roommate.domain.user.dto.AuthRequest;
import com.roommate.p2p_roommate.domain.user.dto.AuthResponse;
import com.roommate.p2p_roommate.domain.user.dto.GoogleAuthRequest;
import com.roommate.p2p_roommate.domain.user.dto.UserRegisterRequest;
import com.roommate.p2p_roommate.domain.user.dto.UserResponse;
import com.roommate.p2p_roommate.domain.user.service.GoogleTokenVerfierService;
import com.roommate.p2p_roommate.domain.user.service.UserService;
import com.roommate.p2p_roommate.domain.user.service.GoogleTokenVerfierService.GoogleUserInfo;
import com.roommate.p2p_roommate.global.security.JwtService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final GoogleTokenVerfierService googleTokenVerfierService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody UserRegisterRequest request) {
        UserResponse user = userService.register(request);
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.email());
        return buildAuthResponse(userDetails, user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            request.email(),
            request.password()
        );

        UserDetails userDetails = (UserDetails) authenticationManager.authenticate(authToken).getPrincipal();
        UserResponse user = userService.getResponseByEmail(userDetails.getUsername());

        return buildAuthResponse(userDetails, user);
    }

    @PostMapping("/google")
    public AuthResponse googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        GoogleUserInfo googleUser = googleTokenVerfierService.verify(request.idToken());
        UserResponse user  = userService.loginWithGoogle(googleUser, request.role());
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.email());
        return buildAuthResponse(userDetails, user);
    }

    private AuthResponse buildAuthResponse(UserDetails userDetails, UserResponse user) {
        return new AuthResponse(jwtService.generateToken(userDetails), user);
    }
}
