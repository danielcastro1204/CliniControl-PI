package com.clinicontrol.service;

import com.clinicontrol.entity.*;
import com.clinicontrol.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RipsService {

    private final AttentionRepository attentionRepository;
    private final ConsultaRepository consultaRepository;
    private final ProcedimientoRepository procedimientoRepository;
    private final PatientRepository patientRepository;
    private final DentistRepository dentistRepository;

    /**
     * Generates a RIPS JSON for a single attention (Particular mode).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> generateParticular(UUID clinicId, UUID attentionId) {
        Attention att = attentionRepository.findByIdAndClinicId(attentionId, clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada"));

        Patient patient = patientRepository.findByIdAndClinicId(att.getPatientId(), clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));

        Map<UUID, Dentist> dentistMap = loadDentistMap(clinicId);

        List<Consulta> consultas = consultaRepository.findByClinicIdAndAttentionIdOrderBySortOrderAsc(clinicId, attentionId);
        List<Procedimiento> procedimientos = procedimientoRepository.findByClinicIdAndAttentionIdOrderBySortOrderAsc(clinicId, attentionId);

        Map<String, Object> usuario = buildUsuario(patient, att, consultas, procedimientos, dentistMap, 1);

        Map<String, Object> rips = new LinkedHashMap<>();
        rips.put("numDocumentoIdObligado", blankToNull(att.getNumDocumentoObligado()));
        rips.put("numFactura", blankToNull(att.getNumeroFactura()));
        rips.put("tipoNota", blankToNull(att.getTipoNota()));
        rips.put("numNota", blankToNull(att.getNumeroNota()));
        rips.put("usuarios", List.of(usuario));

        return rips;
    }

    /**
     * Generates a RIPS JSON for multiple attentions (Amparado mode).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> generateAmparado(UUID clinicId, List<UUID> attentionIds) {
        if (attentionIds == null || attentionIds.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar al menos una atención");
        }

        Map<UUID, Dentist> dentistMap = loadDentistMap(clinicId);

        // Batch-load everything in a handful of queries instead of 4 queries per
        // attention id (previously: N attentions x {attention, patient, consultas,
        // procedimientos} round-trips).
        List<Attention> loadedAttentions = attentionRepository.findByIdInAndClinicId(attentionIds, clinicId);
        Map<UUID, Attention> attentionMap = loadedAttentions.stream()
                .collect(Collectors.toMap(Attention::getId, a -> a));

        List<UUID> patientIds = loadedAttentions.stream().map(Attention::getPatientId).distinct().toList();
        Map<UUID, Patient> patientMap = patientRepository.findByIdInAndClinicId(patientIds, clinicId).stream()
                .collect(Collectors.toMap(Patient::getId, p -> p));

        List<Consulta> allConsultas = consultaRepository.findByClinicIdAndAttentionIdInOrderBySortOrderAsc(clinicId, attentionIds);
        List<Procedimiento> allProcedimientos = procedimientoRepository.findByClinicIdAndAttentionIdInOrderBySortOrderAsc(clinicId, attentionIds);
        Map<UUID, List<Consulta>> consultasByAttention = allConsultas.stream()
                .collect(Collectors.groupingBy(Consulta::getAttentionId));
        Map<UUID, List<Procedimiento>> procedimientosByAttention = allProcedimientos.stream()
                .collect(Collectors.groupingBy(Procedimiento::getAttentionId));

        List<Map<String, Object>> usuarios = new ArrayList<>();
        Attention firstAtt = null;

        for (int i = 0; i < attentionIds.size(); i++) {
            UUID attId = attentionIds.get(i);
            Attention att = attentionMap.get(attId);
            if (att == null) {
                throw new IllegalArgumentException("Atención no encontrada: " + attId);
            }

            if (i == 0) firstAtt = att;

            Patient patient = patientMap.get(att.getPatientId());
            if (patient == null) {
                throw new IllegalArgumentException("Paciente no encontrado para atención: " + attId);
            }

            List<Consulta> consultas = consultasByAttention.getOrDefault(attId, Collections.emptyList());
            List<Procedimiento> procedimientos = procedimientosByAttention.getOrDefault(attId, Collections.emptyList());

            usuarios.add(buildUsuario(patient, att, consultas, procedimientos, dentistMap, i + 1));
        }

        Map<String, Object> rips = new LinkedHashMap<>();
        rips.put("numDocumentoIdObligado", firstAtt != null ? blankToNull(firstAtt.getNumDocumentoObligado()) : null);
        rips.put("numFactura", firstAtt != null ? blankToNull(firstAtt.getNumeroFactura()) : null);
        rips.put("tipoNota", firstAtt != null ? blankToNull(firstAtt.getTipoNota()) : null);
        rips.put("numNota", firstAtt != null ? blankToNull(firstAtt.getNumeroNota()) : null);
        rips.put("usuarios", usuarios);

        return rips;
    }

    /**
     * Returns attentions pre-categorized by patient type for RIPS preview.
     * tipoUsuario "12" → particular, "11" → amparado.
     * This is a business rule enforced server-side.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAttentionsPreview(UUID clinicId) {
        List<Attention> attentions = attentionRepository.findByClinicIdOrderByCreatedAtDesc(clinicId);
        List<Patient> patients = patientRepository.findByClinicIdOrderByPrimerApellidoAscSegundoApellidoAscNombresAsc(clinicId);
        Map<UUID, Patient> patientMap = patients.stream()
                .collect(Collectors.toMap(Patient::getId, p -> p, (a, b) -> a));

        List<UUID> attentionIds = attentions.stream().map(Attention::getId).toList();

        Map<UUID, Long> consultaCounts = new HashMap<>();
        Map<UUID, Long> procedimientoCounts = new HashMap<>();

        if (!attentionIds.isEmpty()) {
            List<Consulta> allConsultas = consultaRepository.findByClinicIdAndAttentionIdInOrderBySortOrderAsc(clinicId, attentionIds);
            for (Consulta c : allConsultas) {
                consultaCounts.merge(c.getAttentionId(), 1L, Long::sum);
            }
            List<Procedimiento> allProcs = procedimientoRepository.findByClinicIdAndAttentionIdInOrderBySortOrderAsc(clinicId, attentionIds);
            for (Procedimiento p : allProcs) {
                procedimientoCounts.merge(p.getAttentionId(), 1L, Long::sum);
            }
        }

        List<Map<String, Object>> particular = new ArrayList<>();
        List<Map<String, Object>> amparado = new ArrayList<>();

        for (Attention att : attentions) {
            Patient patient = patientMap.get(att.getPatientId());
            if (patient == null) continue;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("attentionId", att.getId());
            row.put("patientId", patient.getId());
            row.put("patientNombres", patient.getNombres());
            row.put("patientPrimerApellido", patient.getPrimerApellido());
            row.put("patientSegundoApellido", patient.getSegundoApellido());
            row.put("patientDocumento", patient.getNumDocumentoIdentificacion());
            row.put("fechaInicialAtencion", att.getFechaInicialAtencion());
            row.put("consultaEnabled", att.getConsultaEnabled());
            row.put("procedimientoEnabled", att.getProcedimientoEnabled());
            row.put("totalConsultas", att.getConsultaEnabled() ? consultaCounts.getOrDefault(att.getId(), 0L) : 0L);
            row.put("totalProcedimientos", att.getProcedimientoEnabled() ? procedimientoCounts.getOrDefault(att.getId(), 0L) : 0L);

            if ("12".equals(patient.getTipoUsuario())) {
                particular.add(row);
            } else if ("11".equals(patient.getTipoUsuario())) {
                amparado.add(row);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("particular", particular);
        result.put("amparado", amparado);
        return result;
    }

    // ── Private helpers ──────────────────────────────────────────

    private Map<UUID, Dentist> loadDentistMap(UUID clinicId) {
        return dentistRepository.findByClinicIdOrderByLastName1AscLastName2AscFirstNameAsc(clinicId)
                .stream()
                .collect(Collectors.toMap(Dentist::getId, d -> d, (a, b) -> a));
    }

    private Map<String, Object> buildUsuario(Patient patient, Attention att,
                                              List<Consulta> consultas, List<Procedimiento> procedimientos,
                                              Map<UUID, Dentist> dentistMap, int consecutivo) {
        Map<String, Object> servicios = new LinkedHashMap<>();

        if (att.getConsultaEnabled() && !consultas.isEmpty()) {
            List<Map<String, Object>> consultaList = new ArrayList<>();
            for (int idx = 0; idx < consultas.size(); idx++) {
                Consulta c = consultas.get(idx);
                Dentist dentist = c.getDentistId() != null ? dentistMap.get(c.getDentistId()) : null;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("codPrestador", blankToNull(att.getCodPrestador()));
                row.put("fechaInicioAtencion", blankOrDefault(c.getFechaInicioAtencion(), att.getFechaInicialAtencion()));
                row.put("numAutorizacion", blankToNull(att.getNumAutorizacion()));
                row.put("codigoConsulta", blankToNull(c.getCodigoConsulta()));
                row.put("modalidadGrupoServicioTecSal", blankToNull(c.getModalidadGrupoServicioTecSal()));
                row.put("grupoServicios", blankToNull(c.getGrupoServicios()));
                row.put("codServicio", parseIntOrNull(c.getCodServicio()));
                row.put("finalidadTecnologiaSalud", blankToNull(c.getFinalidadTecnologiaSalud()));
                row.put("tipoDocumentoIdentificacion", dentist != null ? dentist.getTipoDocumento() : null);
                row.put("numDocumentoIdentificacion", dentist != null ? dentist.getIdentification() : null);
                row.put("causaMotivoAtencion", blankToNull(c.getCausaMotivoAtencion()));
                row.put("codigoPrincipalDiagnostico", blankToNull(c.getCodigoPrincipalDiagnostico()));
                row.put("codDiagnosticoRelacionado", null);
                row.put("codComplicacion", null);
                row.put("tipoDiagnosticoPrincipal", blankToNull(c.getTipoDiagnosticoPrincipal()));
                row.put("valorServicio", parseDoubleOrZero(c.getValorServicio()));
                row.put("conceptoRecaudo", blankToNull(c.getConceptoRecaudo()));
                row.put("valorPagoModerador", parseDoubleOrZero(c.getValorPagoModerador()));
                row.put("numFEVPagoModerador", blankToNull(c.getNumFevPagoModerador()));
                row.put("consecutivo", idx + 1);
                consultaList.add(row);
            }
            servicios.put("consultas", consultaList);
        }

        if (att.getProcedimientoEnabled() && !procedimientos.isEmpty()) {
            int startConsecutivo = consultas.size();
            List<Map<String, Object>> procList = new ArrayList<>();
            for (int idx = 0; idx < procedimientos.size(); idx++) {
                Procedimiento p = procedimientos.get(idx);
                Dentist dentist = p.getDentistId() != null ? dentistMap.get(p.getDentistId()) : null;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("codPrestador", blankToNull(att.getCodPrestador()));
                row.put("fechaInicioAtencion", blankOrDefault(p.getFechaInicioAtencion(), att.getFechaInicialAtencion()));
                row.put("idMIPRES", null);
                row.put("numAutorizacion", blankToNull(att.getNumAutorizacion()));
                row.put("codProcedimiento", blankToNull(p.getCodProcedimiento()));
                row.put("viaIngresoServicioSalud", blankToNull(p.getViaIngresoServicioSalud()));
                row.put("modalidadGrupoServicioTecSal", blankToNull(p.getModalidadGrupoServicioTecSal()));
                row.put("grupoServicios", blankToNull(p.getGrupoServicios()));
                row.put("codServicio", parseIntOrNull(p.getCodServicio()));
                row.put("finalidadTecnologiaSalud", blankToNull(p.getFinalidadTecnologiaSalud()));
                row.put("tipoDocumentoIdentificacion", dentist != null ? dentist.getTipoDocumento() : null);
                row.put("numDocumentoIdentificacion", dentist != null ? dentist.getIdentification() : null);
                row.put("codigoPrincipalDiagnostico", blankToNull(p.getCodigoPrincipalDiagnostico()));
                row.put("codDiagnosticoRelacionado", null);
                row.put("codComplicacion", null);
                row.put("valorServicio", parseDoubleOrZero(p.getValorServicio()));
                row.put("conceptoRecaudo", blankToNull(p.getConceptoRecaudo()));
                row.put("valorPagoModerador", parseDoubleOrZero(p.getValorPagoModerador()));
                row.put("numFEVPagoModerador", blankToNull(p.getNumFevPagoModerador()));
                row.put("consecutivo", startConsecutivo + idx + 1);
                procList.add(row);
            }
            servicios.put("procedimientos", procList);
        }

        Map<String, Object> usuario = new LinkedHashMap<>();
        usuario.put("tipoDocumentoIdentificacion", blankToNull(patient.getTipoDocumentoIdentificacion()));
        usuario.put("numDocumentoIdentificacion", blankToNull(patient.getNumDocumentoIdentificacion()));
        usuario.put("tipoUsuario", blankToNull(patient.getTipoUsuario()));
        usuario.put("fechaNacimiento", blankToNull(patient.getFechaNacimiento()));
        usuario.put("codSexo", blankToNull(patient.getCodSexo()));
        usuario.put("codPaisResidencia", blankToNull(patient.getCodPaisResidencia()));
        usuario.put("codMunicipioResidencia", blankToNull(patient.getCodMunicipioResidencia()));
        usuario.put("codZonaTerritorialResidencia", blankToNull(patient.getCodZonaTerritorialResidencia()));
        usuario.put("incapacidad", (patient.getIncapacidad() != null ? patient.getIncapacidad() : "NO").toUpperCase());
        usuario.put("codPaisOrigen", blankToNull(patient.getCodPaisOrigen()));
        usuario.put("consecutivo", consecutivo);
        usuario.put("servicios", servicios.isEmpty() ? null : servicios);

        return usuario;
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private String blankOrDefault(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) return primary;
        if (fallback != null && !fallback.isBlank()) return fallback;
        return null;
    }

    private Integer parseIntOrNull(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private double parseDoubleOrZero(String s) {
        if (s == null || s.isBlank()) return 0;
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
