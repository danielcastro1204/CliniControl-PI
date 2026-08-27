package com.clinicontrol.service;

import com.clinicontrol.entity.Attention;
import com.clinicontrol.entity.Consulta;
import com.clinicontrol.entity.Procedimiento;
import com.clinicontrol.repository.AttentionRepository;
import com.clinicontrol.repository.ConsultaRepository;
import com.clinicontrol.repository.ProcedimientoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttentionService {

    private final AttentionRepository attentionRepository;
    private final ConsultaRepository consultaRepository;
    private final ProcedimientoRepository procedimientoRepository;

    /**
     * Creates an attention with its consultas and procedimientos atomically.
     * Derives fechaInicialAtencion from the first consulta or procedimiento date.
     */
    @Transactional
    public Map<String, Object> createFull(UUID clinicId, Map<String, Object> body) {
        String patientId = (String) body.get("patient_id");
        if (patientId == null || patientId.isBlank()) {
            throw new IllegalArgumentException("Missing patient_id");
        }

        String dentistId = (String) body.get("dentist_id");
        if (dentistId == null || dentistId.isBlank()) {
            throw new IllegalArgumentException("Debe seleccionar un odontólogo responsable.");
        }

        boolean consultaEnabled = body.get("consulta_enabled") != null && (Boolean) body.get("consulta_enabled");
        boolean procedimientoEnabled = body.get("procedimiento_enabled") != null && (Boolean) body.get("procedimiento_enabled");

        if (!consultaEnabled && !procedimientoEnabled) {
            throw new IllegalArgumentException("Debe activar al menos Consulta o Procedimiento.");
        }

        String numeroFactura = (String) body.getOrDefault("numero_factura", "");
        if (numeroFactura == null || numeroFactura.isBlank()) {
            throw new IllegalArgumentException("El número de factura es obligatorio.");
        }

        List<Map<String, Object>> consultas = consultaEnabled
                ? getListFromBody(body, "consultas") : Collections.emptyList();
        List<Map<String, Object>> procedimientos = procedimientoEnabled
                ? getListFromBody(body, "procedimientos") : Collections.emptyList();

        // Validate RIPS fields per consulta
        if (consultaEnabled) {
            for (int i = 0; i < consultas.size(); i++) {
                Map<String, Object> row = consultas.get(i);
                List<String> missing = new ArrayList<>();
                if (isBlank(row, "dentist_id")) missing.add("dentist_id");
                if (isBlank(row, "fecha_inicio_atencion")) missing.add("fecha_inicio_atencion");
                if (isBlank(row, "codigo_consulta")) missing.add("codigo_consulta");
                if (isBlank(row, "cod_servicio")) missing.add("cod_servicio");
                if (isBlank(row, "finalidad_tecnologia_salud")) missing.add("finalidad_tecnologia_salud");
                if (isBlank(row, "causa_motivo_atencion")) missing.add("causa_motivo_atencion");
                if (isBlank(row, "codigo_principal_diagnostico")) missing.add("codigo_principal_diagnostico");
                if (isBlank(row, "tipo_diagnostico_principal")) missing.add("tipo_diagnostico_principal");
                if (isBlank(row, "concepto_recaudo")) missing.add("concepto_recaudo");
                if (!missing.isEmpty()) {
                    throw new IllegalArgumentException("Consulta #" + (i + 1) + ": campos obligatorios faltantes: " + String.join(", ", missing));
                }
            }
        }

        // Validate RIPS fields per procedimiento
        if (procedimientoEnabled) {
            for (int i = 0; i < procedimientos.size(); i++) {
                Map<String, Object> row = procedimientos.get(i);
                List<String> missing = new ArrayList<>();
                if (isBlank(row, "dentist_id")) missing.add("dentist_id");
                if (isBlank(row, "fecha_inicio_atencion")) missing.add("fecha_inicio_atencion");
                if (isBlank(row, "cod_procedimiento")) missing.add("cod_procedimiento");
                if (isBlank(row, "cod_servicio")) missing.add("cod_servicio");
                if (isBlank(row, "finalidad_tecnologia_salud")) missing.add("finalidad_tecnologia_salud");
                if (isBlank(row, "codigo_principal_diagnostico")) missing.add("codigo_principal_diagnostico");
                if (isBlank(row, "concepto_recaudo")) missing.add("concepto_recaudo");
                if (!missing.isEmpty()) {
                    throw new IllegalArgumentException("Procedimiento #" + (i + 1) + ": campos obligatorios faltantes: " + String.join(", ", missing));
                }
            }
        }

        // Derive fechaInicialAtencion from first child date
        String fechaInicial = deriveFechaInicial(consultas, procedimientos);

        Attention attention = Attention.builder()
                .clinicId(clinicId)
                .patientId(UUID.fromString(patientId))
                .dentistId(dentistId != null && !dentistId.isBlank() ? UUID.fromString(dentistId) : null)
                .codPrestador((String) body.getOrDefault("cod_prestador", ""))
                .numDocumentoObligado((String) body.getOrDefault("num_documento_obligado", ""))
                .consecutivoUsuario((String) body.getOrDefault("consecutivo_usuario", "1"))
                .fechaInicialAtencion(fechaInicial)
                .numAutorizacion((String) body.getOrDefault("num_autorizacion", ""))
                .tipoDocumentoIdentificacion((String) body.getOrDefault("tipo_documento_identificacion", ""))
                .numeroDocumentoIdentificacion((String) body.getOrDefault("numero_documento_identificacion", ""))
                .consultaEnabled(consultaEnabled)
                .procedimientoEnabled(procedimientoEnabled)
                .numeroFactura((String) body.getOrDefault("numero_factura", ""))
                .tipoNota((String) body.getOrDefault("tipo_nota", ""))
                .numeroNota((String) body.getOrDefault("numero_nota", ""))
                .build();

        attention = attentionRepository.save(attention);

        // Save consultas
        List<Consulta> savedConsultas = new ArrayList<>();
        if (consultaEnabled) {
            for (int i = 0; i < consultas.size(); i++) {
                Map<String, Object> row = consultas.get(i);
                String cDentistId = (String) row.get("dentist_id");
                Consulta c = Consulta.builder()
                        .clinicId(clinicId)
                        .attentionId(attention.getId())
                        .dentistId(cDentistId != null && !cDentistId.isBlank() ? UUID.fromString(cDentistId) : null)
                        .fechaInicioAtencion((String) row.getOrDefault("fecha_inicio_atencion", ""))
                        .codigoConsulta((String) row.getOrDefault("codigo_consulta", ""))
                        .modalidadGrupoServicioTecSal((String) row.getOrDefault("modalidad_grupo_servicio_tec_sal", ""))
                        .grupoServicios((String) row.getOrDefault("grupo_servicios", ""))
                        .codServicio((String) row.getOrDefault("cod_servicio", ""))
                        .finalidadTecnologiaSalud((String) row.getOrDefault("finalidad_tecnologia_salud", ""))
                        .causaMotivoAtencion((String) row.getOrDefault("causa_motivo_atencion", ""))
                        .codigoPrincipalDiagnostico((String) row.getOrDefault("codigo_principal_diagnostico", ""))
                        .tipoDiagnosticoPrincipal((String) row.getOrDefault("tipo_diagnostico_principal", ""))
                        .valorServicio((String) row.getOrDefault("valor_servicio", "0"))
                        .conceptoRecaudo((String) row.getOrDefault("concepto_recaudo", ""))
                        .valorPagoModerador((String) row.getOrDefault("valor_pago_moderador", "0"))
                        .numFevPagoModerador((String) row.getOrDefault("num_fev_pago_moderador", ""))
                        .sortOrder(i)
                        .build();
                savedConsultas.add(consultaRepository.save(c));
            }
        }

        // Save procedimientos
        List<Procedimiento> savedProcedimientos = new ArrayList<>();
        if (procedimientoEnabled) {
            for (int i = 0; i < procedimientos.size(); i++) {
                Map<String, Object> row = procedimientos.get(i);
                String pDentistId = (String) row.get("dentist_id");
                Procedimiento p = Procedimiento.builder()
                        .clinicId(clinicId)
                        .attentionId(attention.getId())
                        .dentistId(pDentistId != null && !pDentistId.isBlank() ? UUID.fromString(pDentistId) : null)
                        .fechaInicioAtencion((String) row.getOrDefault("fecha_inicio_atencion", ""))
                        .codProcedimiento((String) row.getOrDefault("cod_procedimiento", ""))
                        .viaIngresoServicioSalud((String) row.getOrDefault("via_ingreso_servicio_salud", ""))
                        .modalidadGrupoServicioTecSal((String) row.getOrDefault("modalidad_grupo_servicio_tec_sal", ""))
                        .grupoServicios((String) row.getOrDefault("grupo_servicios", ""))
                        .codServicio((String) row.getOrDefault("cod_servicio", ""))
                        .finalidadTecnologiaSalud((String) row.getOrDefault("finalidad_tecnologia_salud", ""))
                        .codigoPrincipalDiagnostico((String) row.getOrDefault("codigo_principal_diagnostico", ""))
                        .valorServicio((String) row.getOrDefault("valor_servicio", "0"))
                        .conceptoRecaudo((String) row.getOrDefault("concepto_recaudo", ""))
                        .valorPagoModerador((String) row.getOrDefault("valor_pago_moderador", "0"))
                        .numFevPagoModerador((String) row.getOrDefault("num_fev_pago_moderador", ""))
                        .sortOrder(i)
                        .build();
                savedProcedimientos.add(procedimientoRepository.save(p));
            }
        }

        return buildHydratedResponse(attention, savedConsultas, savedProcedimientos);
    }

    /**
     * Returns all attentions for a clinic, hydrated with consultas and procedimientos.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllHydrated(UUID clinicId) {
        List<Attention> attentions = attentionRepository.findByClinicIdOrderByCreatedAtDesc(clinicId);
        return hydrateAttentions(clinicId, attentions);
    }

    /**
     * Returns attentions for a given patient, hydrated.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByPatientHydrated(UUID clinicId, UUID patientId) {
        List<Attention> attentions = attentionRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, patientId);
        return hydrateAttentions(clinicId, attentions);
    }

    /**
     * Returns a single attention by id, hydrated.
     */
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getByIdHydrated(UUID clinicId, UUID id) {
        return attentionRepository.findByIdAndClinicId(id, clinicId)
                .map(att -> {
                    List<Consulta> consultas = consultaRepository.findByClinicIdAndAttentionIdOrderBySortOrderAsc(clinicId, att.getId());
                    List<Procedimiento> procedimientos = procedimientoRepository.findByClinicIdAndAttentionIdOrderBySortOrderAsc(clinicId, att.getId());
                    return buildHydratedResponse(att, consultas, procedimientos);
                });
    }

    // ── Helpers ──────────────────────────────────────────────────

    private List<Map<String, Object>> hydrateAttentions(UUID clinicId, List<Attention> attentions) {
        if (attentions.isEmpty()) return Collections.emptyList();

        List<UUID> ids = attentions.stream().map(Attention::getId).collect(Collectors.toList());

        List<Consulta> allConsultas = consultaRepository.findByClinicIdAndAttentionIdInOrderBySortOrderAsc(clinicId, ids);
        List<Procedimiento> allProcedimientos = procedimientoRepository.findByClinicIdAndAttentionIdInOrderBySortOrderAsc(clinicId, ids);

        Map<UUID, List<Consulta>> consultasByAtt = allConsultas.stream()
                .collect(Collectors.groupingBy(Consulta::getAttentionId));
        Map<UUID, List<Procedimiento>> procsByAtt = allProcedimientos.stream()
                .collect(Collectors.groupingBy(Procedimiento::getAttentionId));

        return attentions.stream()
                .map(att -> buildHydratedResponse(
                        att,
                        consultasByAtt.getOrDefault(att.getId(), Collections.emptyList()),
                        procsByAtt.getOrDefault(att.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildHydratedResponse(Attention att, List<Consulta> consultas, List<Procedimiento> procedimientos) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", att.getId());
        result.put("clinic_id", att.getClinicId());
        result.put("patient_id", att.getPatientId());
        result.put("dentist_id", att.getDentistId());
        result.put("cod_prestador", att.getCodPrestador());
        result.put("num_documento_obligado", att.getNumDocumentoObligado());
        result.put("consecutivo_usuario", att.getConsecutivoUsuario());
        result.put("fecha_inicial_atencion", att.getFechaInicialAtencion());
        result.put("num_autorizacion", att.getNumAutorizacion());
        result.put("tipo_documento_identificacion", att.getTipoDocumentoIdentificacion());
        result.put("numero_documento_identificacion", att.getNumeroDocumentoIdentificacion());
        result.put("consulta_enabled", att.getConsultaEnabled());
        result.put("procedimiento_enabled", att.getProcedimientoEnabled());
        result.put("numero_factura", att.getNumeroFactura());
        result.put("tipo_nota", att.getTipoNota());
        result.put("numero_nota", att.getNumeroNota());
        result.put("created_at", att.getCreatedAt());
        result.put("consultas", consultas);
        result.put("procedimientos", procedimientos);
        return result;
    }

    private String deriveFechaInicial(List<Map<String, Object>> consultas, List<Map<String, Object>> procedimientos) {
        String fecha = "";
        if (!consultas.isEmpty()) {
            fecha = (String) consultas.get(0).getOrDefault("fecha_inicio_atencion", "");
        }
        if ((fecha == null || fecha.isBlank()) && !procedimientos.isEmpty()) {
            fecha = (String) procedimientos.get(0).getOrDefault("fecha_inicio_atencion", "");
        }
        if (fecha == null || fecha.isBlank()) {
            fecha = java.time.LocalDate.now().toString();
        }
        return fecha;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getListFromBody(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(e -> e instanceof Map)
                    .map(e -> (Map<String, Object>) e)
                    .collect(java.util.stream.Collectors.toList());
        }
        return Collections.emptyList();
    }

    private boolean isBlank(Map<String, Object> row, String key) {
        Object val = row.get(key);
        return val == null || val.toString().trim().isEmpty();
    }
}
