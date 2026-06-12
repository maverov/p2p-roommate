package com.roommate.p2p_roommate.global.security;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
        AuthenticationException authException
    ) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        Map<String, Object> errorPayload = Map.of(
            "status", HttpServletResponse.SC_UNAUTHORIZED,
            "error", "Unauthorized",
            "message", "Full authentication credentials are required to execute this request.",
            "path", request.getServletPath()
        );

        objectMapper.writeValue(response.getOutputStream(), errorPayload);
    }
}
