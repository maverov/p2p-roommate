package com.roommate.p2p_roommate.domain.user.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import com.roommate.p2p_roommate.domain.user.dto.UserRegisterRequest;
import com.roommate.p2p_roommate.domain.user.dto.UserResponse;
import com.roommate.p2p_roommate.domain.user.entity.User;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "bio", ignore = true)
    @Mapping(target = "profilePictureUrl", ignore = true)
    @Mapping(target = "isVerified", constant = "false")
    @Mapping(target = "verificationBadgeExpiresAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    User toEntity(UserRegisterRequest request);

    @Mapping(source = "verified", target = "isVerified")
    UserResponse toResponse(User user);
    
}
