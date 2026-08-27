package com.clinicontrol.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    @Builder.Default
    private String marca = "";

    @Column(name = "presentacion_comercial", nullable = false)
    @Builder.Default
    private String presentacionComercial = "";

    @Column(name = "registro_sanitario", nullable = false)
    @Builder.Default
    private String registroSanitario = "";

    @Column(name = "precio_unitario", nullable = false)
    @Builder.Default
    private BigDecimal precioUnitario = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private String proveedor = "";

    @Column(nullable = false)
    @Builder.Default
    private String observaciones = "";

    private String serie;

    @Column(name = "clasificacion_riesgo")
    private String clasificacionRiesgo;

    @Column(name = "vida_util")
    private String vidaUtil;

    private String almacenamiento;

    @Column(name = "principio_activo")
    private String principioActivo;

    @Column(name = "forma_farmaceutica")
    private String formaFarmaceutica;

    private String concentracion;

    @Column(name = "unidad_medida")
    private String unidadMedida;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
