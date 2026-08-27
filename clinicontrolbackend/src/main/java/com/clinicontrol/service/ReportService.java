package com.clinicontrol.service;

import com.clinicontrol.entity.Product;
import com.clinicontrol.entity.ProductInstance;
import com.clinicontrol.repository.ProductInstanceRepository;
import com.clinicontrol.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ProductRepository productRepository;
    private final ProductInstanceRepository productInstanceRepository;

    /**
     * Returns pre-computed report data for the given date range.
     * Client renders PDF/CSV from this data — no N+1 queries needed.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getInventoryReportData(UUID clinicId, String startDate, String endDate) {
        if (startDate == null || startDate.isBlank() || endDate == null || endDate.isBlank()) {
            throw new IllegalArgumentException("Fecha inicial y final son obligatorias");
        }

        LocalDate start;
        LocalDate end;
        try {
            start = LocalDate.parse(startDate);
            end = LocalDate.parse(endDate);
        } catch (Exception e) {
            throw new IllegalArgumentException("Formato de fecha inválido. Use YYYY-MM-DD");
        }

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("La fecha inicial no puede ser posterior a la final");
        }

        List<Product> products = productRepository.findByClinicIdOrderByDescripcionAsc(clinicId);
        List<ProductInstance> allInstances = productInstanceRepository.findByClinicId(clinicId);

        Map<UUID, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // Filter instances by registration date in range
        List<Map<String, Object>> allRows = new ArrayList<>();
        List<Map<String, Object>> consumedRows = new ArrayList<>();

        for (ProductInstance inst : allInstances) {
            if (inst.getFechaRegistro() == null || inst.getFechaRegistro().isBlank()) continue;
            try {
                LocalDate regDate = LocalDate.parse(inst.getFechaRegistro());
                if (regDate.isBefore(start) || regDate.isAfter(end)) continue;
            } catch (Exception e) {
                continue;
            }

            Product product = productMap.get(inst.getProductId());
            if (product == null) continue;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("descripcion", product.getDescripcion());
            row.put("category", product.getCategory());
            row.put("marca", product.getMarca());
            row.put("lote", inst.getLote());
            row.put("fecha_vencimiento", inst.getFechaVencimiento());
            row.put("proveedor", product.getProveedor());
            row.put("cantidad", inst.getCantidad());
            row.put("estado", inst.getEstado());
            row.put("semaforizacion", inst.getSemaforizacion());
            row.put("observaciones", inst.getObservaciones());
            row.put("fecha_salida", inst.getFechaSalida());
            row.put("fecha_registro", inst.getFechaRegistro());
            allRows.add(row);

            if ("usado".equals(inst.getEstado()) || "en_uso".equals(inst.getEstado())) {
                consumedRows.add(row);
            }
        }

        // Build CSV rows for export (all instances, not filtered by date)
        List<Map<String, Object>> csvRows = new ArrayList<>();
        for (ProductInstance inst : allInstances) {
            Product product = productMap.get(inst.getProductId());
            if (product == null) continue;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("descripcion", product.getDescripcion());
            row.put("category", product.getCategory());
            row.put("marca", product.getMarca());
            row.put("lote", inst.getLote());
            row.put("fecha_vencimiento", inst.getFechaVencimiento());
            row.put("proveedor", product.getProveedor());
            row.put("cantidad", inst.getCantidad());
            row.put("estado", inst.getEstado());
            row.put("semaforizacion", inst.getSemaforizacion());
            row.put("observaciones", inst.getObservaciones());
            csvRows.add(row);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total_products", products.size());
        result.put("period_rows", allRows);
        result.put("consumed_rows", consumedRows);
        result.put("csv_rows", csvRows);

        return result;
    }

    /**
     * Returns ALL inventory rows pre-computed for CSV export (no date filter needed).
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCsvExportData(UUID clinicId) {
        List<Product> products = productRepository.findByClinicIdOrderByDescripcionAsc(clinicId);
        List<ProductInstance> allInstances = productInstanceRepository.findByClinicId(clinicId);

        Map<UUID, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductInstance inst : allInstances) {
            Product product = productMap.get(inst.getProductId());
            if (product == null) continue;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("descripcion", product.getDescripcion());
            row.put("category", product.getCategory());
            row.put("marca", product.getMarca());
            row.put("lote", inst.getLote());
            row.put("fecha_vencimiento", inst.getFechaVencimiento());
            row.put("proveedor", product.getProveedor());
            row.put("cantidad", inst.getCantidad());
            row.put("estado", inst.getEstado());
            row.put("semaforizacion", inst.getSemaforizacion());
            row.put("observaciones", inst.getObservaciones());
            rows.add(row);
        }

        return rows;
    }
}
