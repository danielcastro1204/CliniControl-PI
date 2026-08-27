package com.clinicontrol.controller;

import com.clinicontrol.entity.UserRole;
import com.clinicontrol.repository.UserRoleRepository;
import com.clinicontrol.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/rest/v1/user_roles")
@RequiredArgsConstructor
@Slf4j
public class UserRoleController {

    private final UserRoleRepository userRoleRepository;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user,
                                    @RequestParam(name = "user_id", required = false) String userIdFilter) {
        if (userIdFilter == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "user_id filter required"));
        }

        List<UUID> ids = new ArrayList<>();
        if (userIdFilter.startsWith("in.(") && userIdFilter.endsWith(")")) {
            String[] parts = userIdFilter.substring(4, userIdFilter.length() - 1).split(",");
            for (String part : parts) {
                if (!part.isBlank()) {
                    ids.add(UUID.fromString(part.trim()));
                }
            }
        } else if (userIdFilter.startsWith("eq.")) {
            ids.add(UUID.fromString(userIdFilter.substring(3)));
        } else {
            ids.add(UUID.fromString(userIdFilter));
        }

        if (ids.isEmpty()) {
            return ResponseEntity.ok(Map.of("data", List.of()));
        }

        List<UserRole> roles = userRoleRepository.findByUserIdIn(ids);
        List<Map<String, String>> data = roles.stream().map(r -> Map.of(
                "user_id", r.getUserId().toString(),
                "role", r.getRole().name()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("data", data));
    }
}
