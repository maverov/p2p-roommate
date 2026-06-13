package com.roommate.p2p_roommate.domain.user.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.roommate.p2p_roommate.global.security.GoogleOAuthProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GoogleTokenVerfierService {

    private final GoogleOAuthProperties googleOAuthProperties;

    public GoogleUserInfo verify(String idToken) {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleOAuthProperties.clientId()))
                .build();

        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new BadCredentialsException("Invalid Google ID token.");
            }

            GoogleIdToken.Payload payload = token.getPayload();

            return new GoogleUserInfo(
                    payload.getSubject(),
                    payload.getEmail(),
                    (String) payload.get("name"),
                    (String) payload.get("picture"));
        } catch (GeneralSecurityException | IOException e) {
            throw new BadCredentialsException("Failed to verify Google ID token.", e);
        }
    }

    public record GoogleUserInfo(
            String googleId,
            String email,
            String name,
            String pictureUrl) {
    }
}
