package com.clinicontrol.controller;

import com.clinicontrol.entity.Product;
import com.clinicontrol.entity.ProductInstance;
import com.clinicontrol.repository.ProductInstanceRepository;
import com.clinicontrol.service.InventoryService;
import com.clinicontrol.service.ProductService;
import com.clinicontrol.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/rest/v1/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;
    private final ProductInstanceRepository productInstanceRepository;

    /** Business rule: threshold below which stock is considered low */
    private static final int LOW_STOCK_THRESHOLD = 5;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        List<Product> products = productService.getAllByClinic(user.getClinicId());
        return ResponseEntity.ok(Map.of("data", products));
    }

    /**
     * Returns all products with pre-computed stock, closest expiration semaphore.
     * Eliminates N+1 queries from frontend.
     */
    @GetMapping("/with-stock")
    public ResponseEntity<?> getAllWithStock(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        List<Product> products = productService.getAllByClinic(user.getClinicId());
        List<ProductInstance> allInstances = productInstanceRepository.findByClinicId(user.getClinicId());

        // Group instances by product_id
        Map<UUID, List<ProductInstance>> instancesByProduct = allInstances.stream()
                .collect(Collectors.groupingBy(ProductInstance::getProductId));

        List<Map<String, Object>> result = products.stream().map(product -> {
            List<ProductInstance> instances = instancesByProduct.getOrDefault(product.getId(), Collections.emptyList());
            int stock = instances.stream().mapToInt(ProductInstance::getCantidad).sum();

            ProductInstance closestInst = instances.stream()
                    .filter(i -> i.getCantidad() > 0 && i.getFechaVencimiento() != null && !i.getFechaVencimiento().isBlank())
                    .min(Comparator.comparing(ProductInstance::getFechaVencimiento))
                    .orElse(null);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("product", product);
            row.put("stock", stock);
            row.put("closest_semaphore", closestInst != null
                    ? InventoryService.calcularSemaforizacion(closestInst.getFechaVencimiento())
                    : null);
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("low_stock_threshold", LOW_STOCK_THRESHOLD);
        response.put("items", result);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        return productService.getById(id, user.getClinicId())
                .map(p -> ResponseEntity.ok(Map.of("data", p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Map<String, Object> body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Product product = productService.create(user.getClinicId(), body);
            return ResponseEntity.status(HttpStatus.CREATED).body(product);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating product", e);
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
            Product product = productService.update(id, user.getClinicId(), updates);
            return ResponseEntity.ok(product);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating product", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        productService.delete(id, user.getClinicId());
        return ResponseEntity.ok(Map.of());
    }
}
