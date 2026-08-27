package com.clinicontrol.controller;

import com.clinicontrol.entity.*;
import com.clinicontrol.repository.*;
import com.clinicontrol.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/functions/v1")
@RequiredArgsConstructor
@Slf4j
public class FunctionsController {

    private final AuthUserRepository authUserRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/create-clinic-user")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> createClinicUser(@AuthenticationPrincipal AuthenticatedUser user,
                                              @RequestBody Map<String, Object> body) {
        try {
            if (user.getClinicId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "No se encontró consultorio"));
            }

            String email = (String) body.get("email");
            String password = (String) body.get("password");
            String firstName = (String) body.get("first_name");
            String lastName = (String) body.get("last_name");

            if (email == null || password == null || firstName == null || lastName == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Campos obligatorios faltantes"));
            }

            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener al menos 6 caracteres"));
            }

            if (authUserRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ya existe un usuario con ese correo electrónico"));
            }

            // Create auth user
            AuthUser authUser = AuthUser.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .build();
            authUser = authUserRepository.save(authUser);

            // Create profile
            Profile profile = Profile.builder()
                    .userId(authUser.getId())
                    .clinicId(user.getClinicId())
                    .firstName(firstName)
                    .lastName(lastName)
                    .identification((String) body.get("identification"))
                    .phone((String) body.get("phone"))
                    .username((String) body.get("username"))
                    .userType((String) body.get("user_type"))
                    .isActive(true)
                    .build();
            profileRepository.save(profile);

            // Assign clinico role
            userRoleRepository.insertWithCast(UUID.randomUUID(), authUser.getId(), "clinico");

            return ResponseEntity.ok(Map.of("success", true, "user_id", authUser.getId().toString()));
        } catch (Exception e) {
            log.error("Error creating clinic user", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "An internal error occurred"));
        }
    }
}
