package com.clinicontrol.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attentions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Attention {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "dentist_id")
    private UUID dentistId;

    @Column(name = "cod_prestador", nullable = false)
    @Builder.Default
    private String codPrestador = "";

    @Column(name = "num_documento_obligado", nullable = false)
    @Builder.Default
    private String numDocumentoObligado = "";

    @Column(name = "consecutivo_usuario", nullable = false)
    @Builder.Default
    private String consecutivoUsuario = "1";

    @Column(name = "fecha_inicial_atencion", nullable = false)
    @Builder.Default
    private String fechaInicialAtencion = "";

    @Column(name = "num_autorizacion", nullable = false)
    @Builder.Default
    private String numAutorizacion = "";

    @Column(name = "tipo_documento_identificacion", nullable = false)
    @Builder.Default
    private String tipoDocumentoIdentificacion = "";

    @Column(name = "numero_documento_identificacion", nullable = false)
    @Builder.Default
    private String numeroDocumentoIdentificacion = "";

    @Column(name = "consulta_enabled", nullable = false)
    @Builder.Default
    private Boolean consultaEnabled = false;

    @Column(name = "procedimiento_enabled", nullable = false)
    @Builder.Default
    private Boolean procedimientoEnabled = false;

    @Column(name = "numero_factura", nullable = false)
    @Builder.Default
    private String numeroFactura = "";

    @Column(name = "tipo_nota", nullable = false)
    @Builder.Default
    private String tipoNota = "";

    @Column(name = "numero_nota", nullable = false)
    @Builder.Default
    private String numeroNota = "";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
