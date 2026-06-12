package com.roommate.p2p_roommate.domain.user.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roommate.p2p_roommate.domain.user.dto.UserRegisterRequest;
import com.roommate.p2p_roommate.domain.user.dto.UserResponse;
import com.roommate.p2p_roommate.domain.user.dto.UserUpdateRequest;
import com.roommate.p2p_roommate.domain.user.entity.User;
import com.roommate.p2p_roommate.domain.user.mapper.UserMapper;
import com.roommate.p2p_roommate.domain.user.repository.UserRepository;
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
        return userMapper.toResponse(userRepository.save(user));
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

        return userMapper.toResponse(userRepository.save(user));
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

    private User findAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof UserDetails userDetails) {
            return findByEmail(userDetails.getUsername());
        }

        throw new ResourceNotFoundException("Authenticated user not found.");
    }
}
