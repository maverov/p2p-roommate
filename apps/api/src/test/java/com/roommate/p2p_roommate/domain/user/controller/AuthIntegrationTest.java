package com.roommate.p2p_roommate.domain.user.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.roommate.p2p_roommate.TestcontainersConfiguration;
import com.roommate.p2p_roommate.domain.user.enums.UserRole;
import com.roommate.p2p_roommate.domain.user.service.GoogleTokenVerfierService;
import com.roommate.p2p_roommate.domain.user.service.GoogleTokenVerfierService.GoogleUserInfo;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GoogleTokenVerfierService googleTokenVerfierService;

    @Test
    void register_success_returns201AndAccessToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "tenant@example.com",
                      "password": "password123",
                      "name": "Test Tenant",
                      "role": "TENANT"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.user.email").value("tenant@example.com"))
            .andExpect(jsonPath("$.user.name").value("Test Tenant"))
            .andExpect(jsonPath("$.user.role").value("TENANT"));
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        String body = """
            {
              "email": "duplicate@example.com",
              "password": "password123",
              "name": "First User",
              "role": "TENANT"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("A user with this email already exists."));
    }

    @Test
    void register_invalidPayload_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "not-an-email",
                      "password": "short",
                      "name": "",
                      "role": "TENANT"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Validation failed."))
            .andExpect(jsonPath("$.fieldErrors").isMap());
    }

    @Test
    void login_success_returns200AndAccessToken() throws Exception {
        registerUser("login@example.com", "password123", "Login User", UserRole.TENANT);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "login@example.com",
                      "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.user.email").value("login@example.com"));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        registerUser("wrongpass@example.com", "password123", "Wrong Pass User", UserRole.TENANT);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "wrongpass@example.com",
                      "password": "wrong-password"
                    }
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void googleLogin_newUser_returns200AndCreatesUser() throws Exception {
        stubGoogleUser("google-sub-1", "google.new@example.com", "Google New", "https://example.com/pic.jpg");

        mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "idToken": "fake-id-token",
                      "role": "TENANT"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.user.email").value("google.new@example.com"))
            .andExpect(jsonPath("$.user.name").value("Google New"))
            .andExpect(jsonPath("$.user.profilePictureUrl").value("https://example.com/pic.jpg"));
    }

    @Test
    void googleLogin_existingGoogleUser_returns200SameUser() throws Exception {
        stubGoogleUser("google-sub-2", "google.returning@example.com", "Google Returning", null);

        MvcResult first = mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "idToken": "fake-id-token",
                      "role": "TENANT"
                    }
                    """))
            .andExpect(status().isOk())
            .andReturn();

        String firstUserId = readUserId(first);

        mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "idToken": "fake-id-token",
                      "role": "TENANT"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.user.id").value(firstUserId));
    }

    @Test
    void googleLogin_emailExistsWithPassword_returns409() throws Exception {
        registerUser("existing@example.com", "password123", "Existing User", UserRole.TENANT);

        stubGoogleUser("google-sub-3", "existing@example.com", "Google Existing", null);

        mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "idToken": "fake-id-token",
                      "role": "TENANT"
                    }
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message")
                .value("An account with this email already exists. Please log in with email and passowrd."));
    }

    @Test
    void googleLogin_invalidToken_returns401() throws Exception {
        when(googleTokenVerfierService.verify(anyString()))
            .thenThrow(new BadCredentialsException("Invalid Google ID token."));

        mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "idToken": "bad-token",
                      "role": "TENANT"
                    }
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void getMe_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message")
                .value("Full authentication credentials are required to execute this request."));
    }

    @Test
    void getMe_withToken_returns200() throws Exception {
        String token = registerAndGetToken("me@example.com", "password123", "Me User", UserRole.TENANT);

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", bearer(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("me@example.com"))
            .andExpect(jsonPath("$.name").value("Me User"));
    }

    @Test
    void patchMe_withToken_updatesProfile() throws Exception {
        String token = registerAndGetToken("patch@example.com", "password123", "Old Name", UserRole.TENANT);

        mockMvc.perform(patch("/api/v1/users/me")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "New Name",
                      "phoneNumber": "+359888123456",
                      "bio": "Updated bio"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("New Name"))
            .andExpect(jsonPath("$.phoneNumber").value("+359888123456"))
            .andExpect(jsonPath("$.bio").value("Updated bio"));
    }

    private void registerUser(String email, String password, String name, UserRole role) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "%s",
                      "password": "%s",
                      "name": "%s",
                      "role": "%s"
                    }
                    """.formatted(email, password, name, role.name())))
            .andExpect(status().isCreated());
    }

    private String registerAndGetToken(String email, String password, String name, UserRole role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "%s",
                      "password": "%s",
                      "name": "%s",
                      "role": "%s"
                    }
                    """.formatted(email, password, name, role.name())))
            .andExpect(status().isCreated())
            .andReturn();

        return readAccessToken(result);
    }

    private void stubGoogleUser(String googleId, String email, String name, String pictureUrl) {
        when(googleTokenVerfierService.verify(anyString()))
            .thenReturn(new GoogleUserInfo(googleId, email, name, pictureUrl));
    }

    private String readAccessToken(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("accessToken").asText();
    }

    private String readUserId(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("user").get("id").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
