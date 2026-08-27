package com.clinicontrol.controller;

import com.clinicontrol.entity.ProductInstance;
import com.clinicontrol.repository.ProductInstanceRepository;
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
@RequestMapping("/rest/v1/product_instances")
@RequiredArgsConstructor
@Slf4j
public class ProductInstanceController {

    private final ProductInstanceRepository productInstanceRepository;
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user,
                                    @RequestParam(name = "product_id", required = false) String productIdFilter) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }

        List<ProductInstance> instances;
        if (productIdFilter != null) {
            String pid = productIdFilter.startsWith("eq.") ? productIdFilter.substring(3) : productIdFilter;
            instances = productInstanceRepository.findByClinicIdAndProductId(user.getClinicId(), UUID.fromString(pid));
        } else {
            instances = productInstanceRepository.findByClinicId(user.getClinicId());
        }
        return ResponseEntity.ok(Map.of("data", instances));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        return productInstanceRepository.findByIdAndClinicId(id, user.getClinicId())
                .map(p -> ResponseEntity.ok(Map.of("data", p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Map<String, Object> body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            ProductInstance instance = inventoryService.addStock(user.getClinicId(), body);
            return ResponseEntity.status(HttpStatus.CREATED).body(instance);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating product instance", e);
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
            return inventoryService.updateInstance(id, user.getClinicId(), updates)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error updating product instance", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        productInstanceRepository.deleteByIdAndClinicId(id, user.getClinicId());
        return ResponseEntity.ok(Map.of());
    }
}
