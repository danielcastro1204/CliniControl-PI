package com.clinicontrol.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "patients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(nullable = false)
    private String nombres;

    @Column(name = "primer_apellido", nullable = false)
    private String primerApellido;

    @Column(name = "segundo_apellido", nullable = false)
    @Builder.Default
    private String segundoApellido = "";

    @Column(name = "estado_tratamiento", nullable = false)
    @Builder.Default
    private String estadoTratamiento = "en_tratamiento";

    @Column(name = "tipo_documento_identificacion", nullable = false)
    @Builder.Default
    private String tipoDocumentoIdentificacion = "";

    @Column(name = "num_documento_identificacion", nullable = false)
    private String numDocumentoIdentificacion;

    @Column(name = "tipo_usuario", nullable = false)
    @Builder.Default
    private String tipoUsuario = "";

    @Column(name = "fecha_nacimiento", nullable = false)
    @Builder.Default
    private String fechaNacimiento = "";

    @Column(name = "cod_sexo", nullable = false)
    @Builder.Default
    private String codSexo = "";

    @Column(name = "cod_pais_residencia", nullable = false)
    @Builder.Default
    private String codPaisResidencia = "";

    @Column(name = "cod_municipio_residencia", nullable = false)
    @Builder.Default
    private String codMunicipioResidencia = "";

    @Column(name = "cod_zona_territorial_residencia", nullable = false)
    @Builder.Default
    private String codZonaTerritorialResidencia = "";

    @Column(nullable = false)
    @Builder.Default
    private String incapacidad = "No";

    @Column(name = "cod_pais_origen", nullable = false)
    @Builder.Default
    private String codPaisOrigen = "";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
