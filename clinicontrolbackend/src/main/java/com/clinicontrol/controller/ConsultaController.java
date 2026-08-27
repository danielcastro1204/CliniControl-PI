package com.clinicontrol.controller;

import com.clinicontrol.entity.Consulta;
import com.clinicontrol.repository.ConsultaRepository;
import com.clinicontrol.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/rest/v1/consultas")
@RequiredArgsConstructor
@Slf4j
public class ConsultaController {

    private final ConsultaRepository consultaRepository;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user,
                                    @RequestParam(name = "attention_id", required = false) String attentionIdFilter) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }

        List<Consulta> consultas;
        if (attentionIdFilter != null) {
            if (attentionIdFilter.startsWith("in.(") && attentionIdFilter.endsWith(")")) {
                List<UUID> ids = Arrays.stream(attentionIdFilter.substring(4, attentionIdFilter.length() - 1).split(","))
                        .filter(s -> !s.isBlank())
                        .map(s -> UUID.fromString(s.trim()))
                        .collect(Collectors.toList());
                consultas = consultaRepository.findByClinicIdAndAttentionIdInOrderBySortOrderAsc(user.getClinicId(), ids);
            } else {
                String aid = attentionIdFilter.startsWith("eq.") ? attentionIdFilter.substring(3) : attentionIdFilter;
                consultas = consultaRepository.findByClinicIdAndAttentionIdOrderBySortOrderAsc(user.getClinicId(), UUID.fromString(aid));
            }
        } else {
            consultas = consultaRepository.findByClinicIdOrderBySortOrderAsc(user.getClinicId());
        }

        log.info("Consultas response: {} rows, clinic={}", consultas.size(), user.getClinicId());
        return ResponseEntity.ok(Map.of("data", consultas));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        return consultaRepository.findByIdAndClinicId(id, user.getClinicId())
                .map(c -> ResponseEntity.ok(Map.of("data", c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Object body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            List<Map<String, Object>> rows;
            if (body instanceof List<?> list) {
                rows = list.stream()
                        .filter(e -> e instanceof Map)
                        .map(e -> (Map<String, Object>) e)
                        .collect(java.util.stream.Collectors.toList());
            } else if (body instanceof Map) {
                rows = List.of((Map<String, Object>) body);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid request body"));
            }

            List<Consulta> results = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                String attentionId = (String) row.get("attention_id");
                if (attentionId == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Missing attention_id"));
                }
                String dentistId = (String) row.get("dentist_id");

                Consulta consulta = Consulta.builder()
                        .clinicId(user.getClinicId())
                        .attentionId(UUID.fromString(attentionId))
                        .dentistId(dentistId != null ? UUID.fromString(dentistId) : null)
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
                        .sortOrder(row.get("sort_order") != null ? ((Number) row.get("sort_order")).intValue() : 0)
                        .build();

                consulta = consultaRepository.save(consulta);
                results.add(consulta);
            }

            if (results.size() == 1) {
                return ResponseEntity.status(HttpStatus.CREATED).body(results.get(0));
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(results);
        } catch (Exception e) {
            log.error("Error creating consulta", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal AuthenticatedUser user,
                                    @PathVariable UUID id,
                                    @RequestBody Map<String, Object> updates) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Optional<Consulta> opt = consultaRepository.findByIdAndClinicId(id, user.getClinicId());
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Consulta consulta = opt.get();

            if (updates.containsKey("dentist_id")) {
                String did = (String) updates.get("dentist_id");
                consulta.setDentistId(did != null ? UUID.fromString(did) : null);
            }
            if (updates.containsKey("fecha_inicio_atencion")) consulta.setFechaInicioAtencion((String) updates.get("fecha_inicio_atencion"));
            if (updates.containsKey("codigo_consulta")) consulta.setCodigoConsulta((String) updates.get("codigo_consulta"));
            if (updates.containsKey("modalidad_grupo_servicio_tec_sal")) consulta.setModalidadGrupoServicioTecSal((String) updates.get("modalidad_grupo_servicio_tec_sal"));
            if (updates.containsKey("grupo_servicios")) consulta.setGrupoServicios((String) updates.get("grupo_servicios"));
            if (updates.containsKey("cod_servicio")) consulta.setCodServicio((String) updates.get("cod_servicio"));
            if (updates.containsKey("finalidad_tecnologia_salud")) consulta.setFinalidadTecnologiaSalud((String) updates.get("finalidad_tecnologia_salud"));
            if (updates.containsKey("causa_motivo_atencion")) consulta.setCausaMotivoAtencion((String) updates.get("causa_motivo_atencion"));
            if (updates.containsKey("codigo_principal_diagnostico")) consulta.setCodigoPrincipalDiagnostico((String) updates.get("codigo_principal_diagnostico"));
            if (updates.containsKey("tipo_diagnostico_principal")) consulta.setTipoDiagnosticoPrincipal((String) updates.get("tipo_diagnostico_principal"));
            if (updates.containsKey("valor_servicio")) consulta.setValorServicio((String) updates.get("valor_servicio"));
            if (updates.containsKey("concepto_recaudo")) consulta.setConceptoRecaudo((String) updates.get("concepto_recaudo"));
            if (updates.containsKey("valor_pago_moderador")) consulta.setValorPagoModerador((String) updates.get("valor_pago_moderador"));
            if (updates.containsKey("num_fev_pago_moderador")) consulta.setNumFevPagoModerador((String) updates.get("num_fev_pago_moderador"));
            if (updates.containsKey("sort_order")) consulta.setSortOrder(((Number) updates.get("sort_order")).intValue());

            consulta = consultaRepository.save(consulta);
            return ResponseEntity.ok(consulta);
        } catch (Exception e) {
            log.error("Error updating consulta", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        consultaRepository.deleteByIdAndClinicId(id, user.getClinicId());
        return ResponseEntity.ok(Map.of());
    }
}
