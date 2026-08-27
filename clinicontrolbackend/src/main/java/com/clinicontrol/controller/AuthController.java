package com.clinicontrol.controller;

import com.clinicontrol.entity.*;
import com.clinicontrol.repository.*;
import com.clinicontrol.security.AuthenticatedUser;
import com.clinicontrol.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/auth/v1")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthUserRepository authUserRepository;
    private final ClinicRepository clinicRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @PostMapping("/sign-up")
    @Transactional
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody Map<String, Object> body) {
        try {
            String email = (String) body.get("email");
            String password = (String) body.get("password");
            String firstName = (String) body.get("firstName");
            String lastName = (String) body.get("lastName");
            String clinicName = (String) body.get("clinicName");
            String clinicNit = (String) body.get("clinicNit");
            String clinicAddress = (String) body.get("clinicAddress");
            String clinicPhone = (String) body.get("clinicPhone");
            String clinicCodPrestador = (String) body.get("clinicCodPrestador");

            if (email == null || password == null || firstName == null || lastName == null || clinicName == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
            }

            log.info("Sign-up request: email={}, firstName={}, lastName={}, clinicName={}", email, firstName, lastName, clinicName);

            if (authUserRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of("error", "User already exists"));
            }

            // Create clinic
            Clinic clinic = Clinic.builder()
                    .name(clinicName)
                    .nit(clinicNit)
                    .address(clinicAddress)
                    .phone(clinicPhone)
                    .codPrestador(clinicCodPrestador)
                    .build();
            clinic = clinicRepository.save(clinic);
            log.info("Clinic created: {}", clinic.getId());

            // Create auth user
            AuthUser authUser = AuthUser.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .build();
            authUser = authUserRepository.save(authUser);
            log.info("Auth user created: {}", authUser.getId());

            // Create profile
            Profile profile = Profile.builder()
                    .userId(authUser.getId())
                    .clinicId(clinic.getId())
                    .firstName(firstName)
                    .lastName(lastName)
                    .isActive(true)
                    .build();
            profileRepository.save(profile);
            log.info("Profile created");

            // Assign admin role
            userRoleRepository.insertWithCast(UUID.randomUUID(), authUser.getId(), "admin");
            log.info("Admin role assigned");

            String token = jwtProvider.generateToken(authUser.getId(), email, "admin", clinic.getId());

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("user", Map.of(
                    "id", authUser.getId().toString(),
                    "email", email,
                    "user_metadata", Map.of("name", firstName + " " + lastName)
            ));
            response.put("session", Map.of(
                    "access_token", token,
                    "token_type", "bearer"
            ));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Sign up error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/sign-in")
    public ResponseEntity<Map<String, Object>> signIn(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String password = body.get("password");

            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing email or password"));
            }

            Optional<AuthUser> userOpt = authUserRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
            }

            AuthUser user = userOpt.get();

            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
            }

            Optional<Profile> profileOpt = profileRepository.findByUserId(user.getId());

            // Check if user is active
            if (profileOpt.isPresent() && Boolean.FALSE.equals(profileOpt.get().getIsActive())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Tu cuenta ha sido desactivada. Contacta al administrador."));
            }

            Optional<UserRole> roleOpt = userRoleRepository.findFirstByUserId(user.getId());

            UUID clinicId = profileOpt.map(Profile::getClinicId).orElse(null);
            String role = roleOpt.map(r -> r.getRole().name()).orElse("clinico");

            String token = jwtProvider.generateToken(user.getId(), email, role, clinicId);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("user", Map.of(
                    "id", user.getId().toString(),
                    "email", email
            ));
            response.put("session", Map.of(
                    "access_token", token,
                    "token_type", "bearer"
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Sign in error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getUser(@AuthenticationPrincipal AuthenticatedUser authUser) {
        try {
            if (authUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
            }

            UUID userId = authUser.getId();
            log.info("Fetching user profile and role for: {}", userId);

            Optional<AuthUser> userOpt = authUserRepository.findById(userId);
            Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
            Optional<UserRole> roleOpt = userRoleRepository.findFirstByUserId(userId);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            AuthUser user = userOpt.get();
            Profile profile = profileOpt.orElse(null);
            String role = roleOpt.map(r -> r.getRole().name()).orElse("clinico");

            Map<String, Object> userMetadata = new LinkedHashMap<>();
            userMetadata.put("first_name", profile != null ? profile.getFirstName() : "");
            userMetadata.put("last_name", profile != null ? profile.getLastName() : "");
            userMetadata.put("identification", profile != null ? profile.getIdentification() : null);
            userMetadata.put("phone", profile != null ? profile.getPhone() : null);
            userMetadata.put("username", profile != null ? profile.getUsername() : null);
            userMetadata.put("is_active", profile == null || profile.getIsActive() != false);

            Map<String, Object> profileMap = new LinkedHashMap<>();
            if (profile != null) {
                profileMap.put("id", profile.getId().toString());
                profileMap.put("user_id", userId.toString());
                profileMap.put("first_name", profile.getFirstName());
                profileMap.put("last_name", profile.getLastName());
                profileMap.put("clinic_id", profile.getClinicId() != null ? profile.getClinicId().toString() : null);
                profileMap.put("identification", profile.getIdentification());
                profileMap.put("phone", profile.getPhone());
                profileMap.put("username", profile.getUsername());
                profileMap.put("is_active", profile.getIsActive());
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("user", Map.of(
                    "id", user.getId().toString(),
                    "email", user.getEmail(),
                    "user_metadata", userMetadata
            ));
            response.put("profile", profileMap);
            response.put("role", role);

            log.info("User profile retrieved: userId={}, role={}", userId, role);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Get user error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/sign-out")
    public ResponseEntity<Map<String, Object>> signOut() {
        return ResponseEntity.ok(Map.of("success", true));
    }
}
