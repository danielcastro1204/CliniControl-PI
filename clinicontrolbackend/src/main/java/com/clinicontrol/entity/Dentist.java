package com.clinicontrol.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "dentists")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Dentist {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name_1", nullable = false)
    @JsonProperty("last_name_1")
    private String lastName1;

    @Column(name = "last_name_2")
    @Builder.Default
    @JsonProperty("last_name_2")
    private String lastName2 = "";

    @Column(nullable = false)
    private String identification;

    @Column(name = "tipo_documento", nullable = false)
    @Builder.Default
    private String tipoDocumento = "CC";

    @Column(name = "cod_prestador", nullable = false)
    private String codPrestador;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
