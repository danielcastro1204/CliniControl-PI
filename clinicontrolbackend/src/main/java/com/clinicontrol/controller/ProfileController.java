package com.clinicontrol.controller;

import com.clinicontrol.entity.Profile;
import com.clinicontrol.repository.AuthUserRepository;
import com.clinicontrol.repository.ProfileRepository;
import com.clinicontrol.repository.UserRoleRepository;
import com.clinicontrol.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/rest/v1/profiles")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuthUserRepository authUserRepository;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        List<Profile> profiles = profileRepository.findByClinicIdOrderByLastNameAscFirstNameAsc(user.getClinicId());
        return ResponseEntity.ok(Map.of("data", profiles));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal AuthenticatedUser user,
                                    @PathVariable UUID id,
                                    @RequestBody Map<String, Object> updates) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Optional<Profile> opt = profileRepository.findByIdAndClinicId(id, user.getClinicId());
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Profile profile = opt.get();

            List<String> allowedFields = List.of("first_name", "last_name", "identification", "phone", "username", "is_active");
            boolean hasValidField = false;

            for (String key : updates.keySet()) {
                if (allowedFields.contains(key)) {
                    hasValidField = true;
                    break;
                }
            }

            if (!hasValidField) {
                return ResponseEntity.badRequest().body(Map.of("error", "No valid fields to update"));
            }

            if (updates.containsKey("first_name")) profile.setFirstName((String) updates.get("first_name"));
            if (updates.containsKey("last_name")) profile.setLastName((String) updates.get("last_name"));
            if (updates.containsKey("identification")) profile.setIdentification((String) updates.get("identification"));
            if (updates.containsKey("phone")) profile.setPhone((String) updates.get("phone"));
            if (updates.containsKey("username")) profile.setUsername((String) updates.get("username"));
            if (updates.containsKey("is_active")) profile.setIsActive((Boolean) updates.get("is_active"));

            profile = profileRepository.save(profile);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Error updating profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Optional<Profile> opt = profileRepository.findByIdAndClinicId(id, user.getClinicId());
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Profile profile = opt.get();

            // Prevent deleting yourself
            if (profile.getUserId().equals(user.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "No puedes eliminar tu propio usuario"));
            }

            UUID userId = profile.getUserId();

            // Delete user_role, profile, then auth_user
            userRoleRepository.findFirstByUserId(userId).ifPresent(userRoleRepository::delete);
            profileRepository.delete(profile);
            authUserRepository.findById(userId).ifPresent(authUserRepository::delete);

            return ResponseEntity.ok(Map.of());
        } catch (Exception e) {
            log.error("Error deleting profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }
}
