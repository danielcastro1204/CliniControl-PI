package com.clinicontrol.controller;

import com.clinicontrol.entity.Patient;
import com.clinicontrol.service.PatientService;
import com.clinicontrol.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/rest/v1/patients")
@RequiredArgsConstructor
@Slf4j
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user,
                                    @RequestParam(name = "id", required = false) String idFilter) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }

        if (idFilter != null) {
            String rawId = idFilter.startsWith("eq.") ? idFilter.substring(3) : idFilter;
            return patientService.getById(UUID.fromString(rawId), user.getClinicId())
                    .map(p -> ResponseEntity.ok(Map.of("data", List.of(p))))
                    .orElse(ResponseEntity.ok(Map.of("data", List.of())));
        }

        List<Patient> patients = patientService.getAllByClinic(user.getClinicId());
        return ResponseEntity.ok(Map.of("data", patients));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        return patientService.getById(id, user.getClinicId())
                .map(p -> ResponseEntity.ok(Map.of("data", p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Map<String, Object> body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Patient patient = patientService.create(user.getClinicId(), body);
            return ResponseEntity.status(HttpStatus.CREATED).body(patient);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating patient", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal AuthenticatedUser user,
                                    @PathVariable UUID id,
                                    @RequestBody Map<String, Object> updates) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Patient patient = patientService.update(id, user.getClinicId(), updates);
            return ResponseEntity.ok(Map.of("data", patient));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating patient", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        patientService.delete(id, user.getClinicId());
        return ResponseEntity.ok(Map.of());
    }
}
