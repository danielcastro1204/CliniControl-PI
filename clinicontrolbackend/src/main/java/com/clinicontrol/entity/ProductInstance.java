package com.clinicontrol.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_instances")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false)
    @Builder.Default
    private String lote = "";

    @Column(name = "fecha_registro", nullable = false)
    @Builder.Default
    private String fechaRegistro = "";

    @Column(name = "fecha_vencimiento", nullable = false)
    @Builder.Default
    private String fechaVencimiento = "";

    @Column(nullable = false)
    @Builder.Default
    private Integer cantidad = 0;

    @Column(name = "dias_disponibilidad", nullable = false)
    @Builder.Default
    private Integer diasDisponibilidad = 0;

    @Column(name = "fecha_salida", nullable = false)
    @Builder.Default
    private String fechaSalida = "";

    @Column(nullable = false)
    @Builder.Default
    private String estado = "almacenado";

    @Column(nullable = false)
    @Builder.Default
    private String semaforizacion = "verde";

    @Column(nullable = false)
    @Builder.Default
    private String observaciones = "";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
