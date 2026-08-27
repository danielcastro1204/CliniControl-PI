package com.clinicontrol.service;

import com.clinicontrol.entity.InventoryMovement;
import com.clinicontrol.entity.ProductInstance;
import com.clinicontrol.repository.InventoryMovementRepository;
import com.clinicontrol.repository.ProductInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final ProductInstanceRepository productInstanceRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    /**
     * Atomically consumes stock: validates qty, decrements instance, creates movement.
     */
    @Transactional
    public Map<String, Object> consumeStock(UUID clinicId, UUID userId, Map<String, Object> body) {
        String instanceId = (String) body.get("instance_id");
        String productId = (String) body.get("product_id");
        Object cantidadObj = body.get("cantidad");

        if (instanceId == null || productId == null || cantidadObj == null) {
            throw new IllegalArgumentException("Missing required fields: instance_id, product_id, cantidad");
        }

        int qty = ((Number) cantidadObj).intValue();
        if (qty <= 0) {
            throw new IllegalArgumentException("Cantidad must be greater than 0");
        }

        ProductInstance instance = productInstanceRepository.findByIdAndClinicId(UUID.fromString(instanceId), clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Instancia no encontrada"));

        if (qty > instance.getCantidad()) {
            throw new IllegalArgumentException("No es posible registrar más unidades de las disponibles en el inventario.");
        }

        int newQty = instance.getCantidad() - qty;
        String newEstado = newQty == 0 ? "usado" : "en_uso";

        instance.setCantidad(newQty);
        instance.setEstado(newEstado);
        instance.setFechaSalida(LocalDate.now().toString());
        productInstanceRepository.save(instance);

        String patientId = (String) body.get("patient_id");

        InventoryMovement movement = InventoryMovement.builder()
                .clinicId(clinicId)
                .productId(UUID.fromString(productId))
                .instanceId(UUID.fromString(instanceId))
                .cantidad(qty)
                .lote((String) body.getOrDefault("lote", ""))
                .fechaUso(LocalDate.now().toString())
                .userId(userId)
                .userName((String) body.getOrDefault("user_name", ""))
                .patientId(patientId != null && !patientId.isBlank() ? UUID.fromString(patientId) : null)
                .patientName((String) body.getOrDefault("patient_name", ""))
                .tipoMovimiento("consumo")
                .observaciones((String) body.getOrDefault("observaciones", ""))
                .build();

        movement = inventoryMovementRepository.save(movement);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("instance", instance);
        result.put("movement", movement);
        return result;
    }

    /**
     * Adds stock: creates a ProductInstance with server-computed semaforizacion and diasDisponibilidad.
     */
    @Transactional
    public ProductInstance addStock(UUID clinicId, Map<String, Object> body) {
        String productId = (String) body.get("product_id");
        if (productId == null) {
            throw new IllegalArgumentException("Missing product_id");
        }

        // Validate cantidad > 0
        int cantidad = body.get("cantidad") != null ? ((Number) body.get("cantidad")).intValue() : 0;
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0.");
        }

        String fechaRegistro = (String) body.getOrDefault("fecha_registro", "");
        String fechaVencimiento = (String) body.getOrDefault("fecha_vencimiento", "");

        // Validate date formats
        if (!fechaRegistro.isBlank()) {
            try { LocalDate.parse(fechaRegistro); }
            catch (Exception e) { throw new IllegalArgumentException("Formato de fecha de registro inválido. Use YYYY-MM-DD."); }
        }
        if (!fechaVencimiento.isBlank()) {
            try { LocalDate.parse(fechaVencimiento); }
            catch (Exception e) { throw new IllegalArgumentException("Formato de fecha de vencimiento inválido. Use YYYY-MM-DD."); }
        }

        // Validate fechaVencimiento >= fechaRegistro
        if (!fechaRegistro.isBlank() && !fechaVencimiento.isBlank()) {
            LocalDate reg = LocalDate.parse(fechaRegistro);
            LocalDate venc = LocalDate.parse(fechaVencimiento);
            if (venc.isBefore(reg)) {
                throw new IllegalArgumentException("La fecha de vencimiento no puede ser anterior a la fecha de registro.");
            }
        }

        ProductInstance instance = ProductInstance.builder()
                .clinicId(clinicId)
                .productId(UUID.fromString(productId))
                .lote((String) body.getOrDefault("lote", ""))
                .fechaRegistro(fechaRegistro)
                .fechaVencimiento(fechaVencimiento)
                .cantidad(cantidad)
                .diasDisponibilidad(calcularDiasDisponibilidad(fechaRegistro, fechaVencimiento))
                .fechaSalida("")
                .estado((String) body.getOrDefault("estado", "almacenado"))
                .semaforizacion(calcularSemaforizacion(fechaVencimiento))
                .observaciones((String) body.getOrDefault("observaciones", ""))
                .build();

        return productInstanceRepository.save(instance);
    }

    /**
     * Updates a product instance with server-computed derived fields.
     */
    @Transactional
    public Optional<ProductInstance> updateInstance(UUID id, UUID clinicId, Map<String, Object> updates) {
        Optional<ProductInstance> opt = productInstanceRepository.findByIdAndClinicId(id, clinicId);
        if (opt.isEmpty()) return Optional.empty();

        ProductInstance instance = opt.get();

        if (updates.containsKey("lote")) instance.setLote((String) updates.get("lote"));
        if (updates.containsKey("fecha_registro")) {
            String fr = (String) updates.get("fecha_registro");
            if (fr != null && !fr.isBlank()) {
                try { LocalDate.parse(fr); }
                catch (Exception e) { throw new IllegalArgumentException("Formato de fecha de registro inválido. Use YYYY-MM-DD."); }
            }
            instance.setFechaRegistro(fr);
        }
        if (updates.containsKey("fecha_vencimiento")) {
            String fv = (String) updates.get("fecha_vencimiento");
            if (fv != null && !fv.isBlank()) {
                try { LocalDate.parse(fv); }
                catch (Exception e) { throw new IllegalArgumentException("Formato de fecha de vencimiento inválido. Use YYYY-MM-DD."); }
            }
            instance.setFechaVencimiento(fv);
        }
        if (updates.containsKey("cantidad")) {
            int qty = ((Number) updates.get("cantidad")).intValue();
            if (qty < 0) throw new IllegalArgumentException("La cantidad no puede ser negativa.");
            instance.setCantidad(qty);
        }
        if (updates.containsKey("fecha_salida")) instance.setFechaSalida((String) updates.get("fecha_salida"));
        if (updates.containsKey("estado")) instance.setEstado((String) updates.get("estado"));
        if (updates.containsKey("observaciones")) instance.setObservaciones((String) updates.get("observaciones"));

        // Validate fechaVencimiento >= fechaRegistro after applying updates
        String regStr = instance.getFechaRegistro();
        String vencStr = instance.getFechaVencimiento();
        if (regStr != null && !regStr.isBlank() && vencStr != null && !vencStr.isBlank()) {
            LocalDate reg = LocalDate.parse(regStr);
            LocalDate venc = LocalDate.parse(vencStr);
            if (venc.isBefore(reg)) {
                throw new IllegalArgumentException("La fecha de vencimiento no puede ser anterior a la fecha de registro.");
            }
        }

        // Always recalculate derived fields
        instance.setSemaforizacion(calcularSemaforizacion(instance.getFechaVencimiento()));
        instance.setDiasDisponibilidad(calcularDiasDisponibilidad(instance.getFechaRegistro(), instance.getFechaVencimiento()));

        return Optional.of(productInstanceRepository.save(instance));
    }

    // ── Business logic helpers ──────────────────────────────────

    public static String calcularSemaforizacion(String fechaVencimiento) {
        if (fechaVencimiento == null || fechaVencimiento.isBlank()) return "verde";
        try {
            LocalDate venc = LocalDate.parse(fechaVencimiento);
            long diffDays = ChronoUnit.DAYS.between(LocalDate.now(), venc);
            if (diffDays < 90) return "rojo";
            if (diffDays <= 365) return "amarillo";
            return "verde";
        } catch (Exception e) {
            return "verde";
        }
    }

    public static int calcularDiasDisponibilidad(String fechaRegistro, String fechaVencimiento) {
        if (fechaRegistro == null || fechaRegistro.isBlank()
                || fechaVencimiento == null || fechaVencimiento.isBlank()) return 0;
        try {
            LocalDate reg = LocalDate.parse(fechaRegistro);
            LocalDate venc = LocalDate.parse(fechaVencimiento);
            return (int) Math.max(0, ChronoUnit.DAYS.between(reg, venc));
        } catch (Exception e) {
            return 0;
        }
    }
}
