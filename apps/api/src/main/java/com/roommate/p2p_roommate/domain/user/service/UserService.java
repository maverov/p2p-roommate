package com.roommate.p2p_roommate.domain.user.service;

import java.util.Optional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roommate.p2p_roommate.domain.user.dto.UserRegisterRequest;
import com.roommate.p2p_roommate.domain.user.dto.UserResponse;
import com.roommate.p2p_roommate.domain.user.dto.UserUpdateRequest;
import com.roommate.p2p_roommate.domain.user.entity.User;
import com.roommate.p2p_roommate.domain.user.enums.UserRole;
import com.roommate.p2p_roommate.domain.user.mapper.UserMapper;
import com.roommate.p2p_roommate.domain.user.repository.UserRepository;
import com.roommate.p2p_roommate.domain.user.service.GoogleTokenVerfierService.GoogleUserInfo;
import com.roommate.p2p_roommate.exception.DuplicateResourceException;
import com.roommate.p2p_roommate.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse register(UserRegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("A user with this email already exists.");
        }

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        return userMapper.toResponse(userRepository.saveAndFlush(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        return userMapper.toResponse(findAuthenticatedUser());
    }

    @Transactional
    public UserResponse updateCurrenUser(UserUpdateRequest request) {
        User user = findAuthenticatedUser();

        user.setName(request.name());
        user.setPhoneNumber(request.phoneNumber());
        user.setProfilePictureUrl(request.profilePictureUrl());
        user.setBio(request.bio());

        return userMapper.toResponse(userRepository.saveAndFlush(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getResponseByEmail(String email) {
        return userMapper.toResponse(findByEmail(email));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public UserResponse loginWithGoogle(GoogleUserInfo info, UserRole role) {
        if (info.email() == null || info.email().isBlank()) {
            throw new DuplicateResourceException("Google account did not provide an email");
        }
        UserRole resolvedRole = role != null ? role : UserRole.TENANT;

        Optional<User> existingByGoogleId = userRepository.findByGoogleId(info.googleId());
        if (existingByGoogleId.isPresent()) {
            User user = existingByGoogleId.get();
            updateGoogleProfile(user, info);
            return userMapper.toResponse(userRepository.saveAndFlush(user));
        }

        Optional<User> existingByEmail = userRepository.findByEmail(info.email());
        if (existingByEmail.isPresent()) {
            User user = existingByEmail.get();

            if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
                throw new DuplicateResourceException(
                    "An account with this email already exists. Please log in with email and passowrd."
                );
            }

            user.setGoogleId(info.googleId());
            updateGoogleProfile(user, info);
            return userMapper.toResponse(userRepository.saveAndFlush(user));
        }

        User newUser = User.builder()
        .email(info.email())
        .googleId(info.googleId())
        .name(resolveName(info))
        .profilePictureUrl(info.pictureUrl())
        .role(resolvedRole)
        .isVerified(false)
        .passwordHash(null)
        .build();

        return userMapper.toResponse(userRepository.saveAndFlush(newUser));
    }

    private void updateGoogleProfile(User user, GoogleUserInfo info) {
        if (info.name() != null && !info.name().isBlank()) {
            user.setName(info.name());
        }
        if (info.pictureUrl() != null && !info.pictureUrl().isBlank()) {
            user.setProfilePictureUrl(info.pictureUrl());
        }
    }

    private String resolveName(GoogleUserInfo info) {
        if (info.name() != null && !info.name().isBlank()) {
            return info.name();
        }

        int atIndex = info.email().indexOf('@');
        if (atIndex > 0) {
            return info.email().substring(0, atIndex);
        }
        return "User";
    }

    private User findAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof UserDetails userDetails) {
            return findByEmail(userDetails.getUsername());
        }

        throw new ResourceNotFoundException("Authenticated user not found.");
    }
}
