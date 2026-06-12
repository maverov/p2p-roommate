package com.roommate.p2p_roommate.exception;

import java.util.Map;

public record ErrorResponse(
    int status,
    String error,
    String message,
    String path,
    Map<String, String> fieldErrors
) {
    public ErrorResponse(int status, String error, String message, String path) {
        this(status, error, message, path, null);
    }
}