package com.clinicontrol.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "instance_id", nullable = false)
    private UUID instanceId;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false)
    @Builder.Default
    private String lote = "";

    @Column(name = "fecha_uso", nullable = false)
    @Builder.Default
    private String fechaUso = "";

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", nullable = false)
    @Builder.Default
    private String userName = "";

    @Column(name = "patient_id")
    private UUID patientId;

    @Column(name = "patient_name")
    @Builder.Default
    private String patientName = "";

    @Column(name = "tipo_movimiento", nullable = false)
    @Builder.Default
    private String tipoMovimiento = "consumo";

    @Column(nullable = false)
    @Builder.Default
    private String observaciones = "";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
