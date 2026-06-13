package com.roommate.p2p_roommate.exception;

import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
        MethodArgumentNotValidException ex,
        HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a));
   
        return ResponseEntity.badRequest().body(new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            "Validation failed.",
            request.getServletPath(),
            fieldErrors
        ));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(
        DuplicateResourceException ex,
        HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(
            HttpStatus.CONFLICT.value(), 
            "Not Found",
            ex.getMessage(),
            request.getServletPath()
        ));
    }

    @ExceptionHandler({ BadCredentialsException.class, UsernameNotFoundException.class })
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
        RuntimeException ex,
        HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(
            HttpStatus.UNAUTHORIZED.value(),
            "Unauthorized",
            "Invalid email or password.",
            request.getServletPath()
        ));
    }
}
