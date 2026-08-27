package com.clinicontrol.controller;

import com.clinicontrol.security.AuthenticatedUser;
import com.clinicontrol.service.RipsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/rest/v1/rips")
@RequiredArgsConstructor
@Slf4j
public class RipsController {

    private final RipsService ripsService;

    /**
     * Returns attentions pre-categorized by patient type for the RIPS preview.
     */
    @GetMapping("/attentions")
    public ResponseEntity<?> getAttentionsPreview(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Map<String, Object> preview = ripsService.getAttentionsPreview(user.getClinicId());
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            log.error("Error loading RIPS attentions preview", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    /**
     * Generate RIPS JSON for a single attention (Particular).
     */
    @GetMapping("/particular/{attentionId}")
    public ResponseEntity<?> generateParticular(@AuthenticationPrincipal AuthenticatedUser user,
                                                 @PathVariable UUID attentionId) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Map<String, Object> rips = ripsService.generateParticular(user.getClinicId(), attentionId);
            return ResponseEntity.ok(rips);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error generating particular RIPS", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    /**
     * Generate RIPS JSON for multiple attentions (Amparado).
     * Body: { "attention_ids": ["uuid1", "uuid2", ...] }
     */
    @PostMapping("/amparado")
    public ResponseEntity<?> generateAmparado(@AuthenticationPrincipal AuthenticatedUser user,
                                               @RequestBody Map<String, Object> body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Object rawIds = body.get("attention_ids");
            if (!(rawIds instanceof List<?> rawList)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Debe seleccionar al menos una atención"));
            }
            List<String> ids = rawList.stream()
                    .filter(e -> e instanceof String)
                    .map(e -> (String) e)
                    .toList();
            if (ids.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Debe seleccionar al menos una atención"));
            }
            List<UUID> attentionIds = ids.stream().map(UUID::fromString).toList();
            Map<String, Object> rips = ripsService.generateAmparado(user.getClinicId(), attentionIds);
            return ResponseEntity.ok(rips);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error generating amparado RIPS", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }
}
