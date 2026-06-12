package com.roommate.p2p_roommate.domain.user.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.roommate.p2p_roommate.domain.user.entity.User;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    // For local login authentication workflows
    Optional<User> findByEmail(String email);
    
    // Quick validation checks during onboarding
    boolean existsByEmail(String email);
}