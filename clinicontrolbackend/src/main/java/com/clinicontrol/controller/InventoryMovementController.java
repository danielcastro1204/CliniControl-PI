package com.clinicontrol.controller;

import com.clinicontrol.entity.InventoryMovement;
import com.clinicontrol.repository.InventoryMovementRepository;
import com.clinicontrol.security.AuthenticatedUser;
import com.clinicontrol.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/rest/v1/inventory_movements")
@RequiredArgsConstructor
@Slf4j
public class InventoryMovementController {

    private final InventoryMovementRepository inventoryMovementRepository;
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user,
                                    @RequestParam(name = "product_id", required = false) String productIdFilter) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }

        List<InventoryMovement> movements;
        if (productIdFilter != null) {
            String pid = productIdFilter.startsWith("eq.") ? productIdFilter.substring(3) : productIdFilter;
            movements = inventoryMovementRepository.findByClinicIdAndProductIdOrderByCreatedAtDesc(user.getClinicId(), UUID.fromString(pid));
        } else {
            movements = inventoryMovementRepository.findByClinicIdOrderByCreatedAtDesc(user.getClinicId());
        }
        return ResponseEntity.ok(Map.of("data", movements));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Map<String, Object> body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            String productId = (String) body.get("product_id");
            String instanceId = (String) body.get("instance_id");
            Object cantidadObj = body.get("cantidad");

            if (productId == null || instanceId == null || cantidadObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
            }

            String patientId = (String) body.get("patient_id");

            InventoryMovement movement = InventoryMovement.builder()
                    .clinicId(user.getClinicId())
                    .productId(UUID.fromString(productId))
                    .instanceId(UUID.fromString(instanceId))
                    .cantidad(((Number) cantidadObj).intValue())
                    .userId(user.getId())
                    .lote((String) body.getOrDefault("lote", ""))
                    .fechaUso((String) body.getOrDefault("fecha_uso", ""))
                    .userName((String) body.getOrDefault("user_name", ""))
                    .patientId(patientId != null ? UUID.fromString(patientId) : null)
                    .patientName((String) body.getOrDefault("patient_name", ""))
                    .tipoMovimiento((String) body.getOrDefault("tipo_movimiento", "consumo"))
                    .observaciones((String) body.getOrDefault("observaciones", ""))
                    .build();

            movement = inventoryMovementRepository.save(movement);
            return ResponseEntity.status(HttpStatus.CREATED).body(movement);
        } catch (Exception e) {
            log.error("Error creating inventory movement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @PostMapping("/consume")
    public ResponseEntity<?> consume(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Map<String, Object> body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Map<String, Object> result = inventoryService.consumeStock(user.getClinicId(), user.getId(), body);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error consuming stock", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false, "error", "An internal error occurred"));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        inventoryMovementRepository.deleteByIdAndClinicId(id, user.getClinicId());
        return ResponseEntity.ok(Map.of());
    }
}
