package com.clinicontrol.service;

import com.clinicontrol.entity.Product;
import com.clinicontrol.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    private static final Set<String> VALID_CATEGORIES = Set.of("dispositivos", "medicamentos", "insumos");

    @Transactional(readOnly = true)
    public List<Product> getAllByClinic(UUID clinicId) {
        return productRepository.findByClinicIdOrderByDescripcionAsc(clinicId);
    }

    @Transactional(readOnly = true)
    public Optional<Product> getById(UUID id, UUID clinicId) {
        return productRepository.findByIdAndClinicId(id, clinicId);
    }

    @Transactional
    public Product create(UUID clinicId, Map<String, Object> body) {
        String category = getStr(body, "category");
        String descripcion = getStr(body, "descripcion");

        // Validate required fields
        if (isBlank(category)) {
            throw new IllegalArgumentException("El tipo de producto (category) es obligatorio.");
        }
        if (!VALID_CATEGORIES.contains(category)) {
            throw new IllegalArgumentException("Categoría inválida. Debe ser: dispositivos, medicamentos o insumos.");
        }
        if (isBlank(descripcion)) {
            throw new IllegalArgumentException("La descripción es obligatoria.");
        }

        // Validate precio >= 0
        BigDecimal precio = BigDecimal.ZERO;
        if (body.get("precio_unitario") != null) {
            precio = new BigDecimal(body.get("precio_unitario").toString());
            if (precio.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("El precio unitario no puede ser negativo.");
            }
        }

        Product product = Product.builder()
                .clinicId(clinicId)
                .category(category)
                .descripcion(descripcion)
                .marca(getStr(body, "marca"))
                .presentacionComercial(getStr(body, "presentacion_comercial"))
                .registroSanitario(getStr(body, "registro_sanitario"))
                .precioUnitario(precio)
                .proveedor(getStr(body, "proveedor"))
                .observaciones(getStr(body, "observaciones"))
                .serie((String) body.get("serie"))
                .clasificacionRiesgo((String) body.get("clasificacion_riesgo"))
                .vidaUtil((String) body.get("vida_util"))
                .almacenamiento((String) body.get("almacenamiento"))
                .principioActivo((String) body.get("principio_activo"))
                .formaFarmaceutica((String) body.get("forma_farmaceutica"))
                .concentracion((String) body.get("concentracion"))
                .unidadMedida((String) body.get("unidad_medida"))
                .build();

        return productRepository.save(product);
    }

    @Transactional
    public Product update(UUID id, UUID clinicId, Map<String, Object> updates) {
        Product product = productRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado."));

        if (updates.containsKey("category")) {
            String cat = (String) updates.get("category");
            if (!VALID_CATEGORIES.contains(cat)) {
                throw new IllegalArgumentException("Categoría inválida. Debe ser: dispositivos, medicamentos o insumos.");
            }
            product.setCategory(cat);
        }
        if (updates.containsKey("descripcion")) {
            String d = (String) updates.get("descripcion");
            if (isBlank(d)) throw new IllegalArgumentException("La descripción es obligatoria.");
            product.setDescripcion(d);
        }
        if (updates.containsKey("marca")) product.setMarca((String) updates.get("marca"));
        if (updates.containsKey("presentacion_comercial")) product.setPresentacionComercial((String) updates.get("presentacion_comercial"));
        if (updates.containsKey("registro_sanitario")) product.setRegistroSanitario((String) updates.get("registro_sanitario"));
        if (updates.containsKey("precio_unitario")) {
            BigDecimal precio = new BigDecimal(updates.get("precio_unitario").toString());
            if (precio.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("El precio unitario no puede ser negativo.");
            }
            product.setPrecioUnitario(precio);
        }
        if (updates.containsKey("proveedor")) product.setProveedor((String) updates.get("proveedor"));
        if (updates.containsKey("observaciones")) product.setObservaciones((String) updates.get("observaciones"));
        if (updates.containsKey("serie")) product.setSerie((String) updates.get("serie"));
        if (updates.containsKey("clasificacion_riesgo")) product.setClasificacionRiesgo((String) updates.get("clasificacion_riesgo"));
        if (updates.containsKey("vida_util")) product.setVidaUtil((String) updates.get("vida_util"));
        if (updates.containsKey("almacenamiento")) product.setAlmacenamiento((String) updates.get("almacenamiento"));
        if (updates.containsKey("principio_activo")) product.setPrincipioActivo((String) updates.get("principio_activo"));
        if (updates.containsKey("forma_farmaceutica")) product.setFormaFarmaceutica((String) updates.get("forma_farmaceutica"));
        if (updates.containsKey("concentracion")) product.setConcentracion((String) updates.get("concentracion"));
        if (updates.containsKey("unidad_medida")) product.setUnidadMedida((String) updates.get("unidad_medida"));

        return productRepository.save(product);
    }

    @Transactional
    public void delete(UUID id, UUID clinicId) {
        productRepository.deleteByIdAndClinicId(id, clinicId);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private static String getStr(Map<String, Object> body, String key) {
        Object val = body.get(key);
        return val != null ? val.toString().trim() : "";
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
