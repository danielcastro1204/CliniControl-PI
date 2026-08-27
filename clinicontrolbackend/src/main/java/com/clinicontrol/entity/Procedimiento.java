package com.clinicontrol.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "procedimientos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Procedimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "attention_id", nullable = false)
    private UUID attentionId;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(name = "dentist_id")
    private UUID dentistId;

    @Column(name = "fecha_inicio_atencion", nullable = false)
    @Builder.Default
    private String fechaInicioAtencion = "";

    @Column(name = "cod_procedimiento", nullable = false)
    @Builder.Default
    private String codProcedimiento = "";

    @Column(name = "via_ingreso_servicio_salud", nullable = false)
    @Builder.Default
    private String viaIngresoServicioSalud = "";

    @Column(name = "modalidad_grupo_servicio_tec_sal", nullable = false)
    @Builder.Default
    private String modalidadGrupoServicioTecSal = "";

    @Column(name = "grupo_servicios", nullable = false)
    @Builder.Default
    private String grupoServicios = "";

    @Column(name = "cod_servicio", nullable = false)
    @Builder.Default
    private String codServicio = "";

    @Column(name = "finalidad_tecnologia_salud", nullable = false)
    @Builder.Default
    private String finalidadTecnologiaSalud = "";

    @Column(name = "codigo_principal_diagnostico", nullable = false)
    @Builder.Default
    private String codigoPrincipalDiagnostico = "";

    @Column(name = "valor_servicio", nullable = false)
    @Builder.Default
    private String valorServicio = "0";

    @Column(name = "concepto_recaudo", nullable = false)
    @Builder.Default
    private String conceptoRecaudo = "";

    @Column(name = "valor_pago_moderador", nullable = false)
    @Builder.Default
    private String valorPagoModerador = "0";

    @Column(name = "num_fev_pago_moderador", nullable = false)
    @Builder.Default
    private String numFevPagoModerador = "";

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
