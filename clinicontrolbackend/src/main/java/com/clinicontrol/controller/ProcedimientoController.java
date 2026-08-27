package com.clinicontrol.controller;

import com.clinicontrol.entity.Procedimiento;
import com.clinicontrol.repository.ProcedimientoRepository;
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
@RequestMapping("/rest/v1/procedimientos")
@RequiredArgsConstructor
@Slf4j
public class ProcedimientoController {

    private final ProcedimientoRepository procedimientoRepository;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user,
                                    @RequestParam(name = "attention_id", required = false) String attentionIdFilter) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }

        List<Procedimiento> procedimientos;
        if (attentionIdFilter != null) {
            if (attentionIdFilter.startsWith("in.(") && attentionIdFilter.endsWith(")")) {
                List<UUID> ids = Arrays.stream(attentionIdFilter.substring(4, attentionIdFilter.length() - 1).split(","))
                        .filter(s -> !s.isBlank())
                        .map(s -> UUID.fromString(s.trim()))
                        .collect(Collectors.toList());
                procedimientos = procedimientoRepository.findByClinicIdAndAttentionIdInOrderBySortOrderAsc(user.getClinicId(), ids);
            } else {
                String aid = attentionIdFilter.startsWith("eq.") ? attentionIdFilter.substring(3) : attentionIdFilter;
                procedimientos = procedimientoRepository.findByClinicIdAndAttentionIdOrderBySortOrderAsc(user.getClinicId(), UUID.fromString(aid));
            }
        } else {
            procedimientos = procedimientoRepository.findByClinicIdOrderBySortOrderAsc(user.getClinicId());
        }
        return ResponseEntity.ok(Map.of("data", procedimientos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        return procedimientoRepository.findByIdAndClinicId(id, user.getClinicId())
                .map(p -> ResponseEntity.ok(Map.of("data", p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Object body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            List<Map<String, Object>> rows;
            if (body instanceof List) {
                rows = (List<Map<String, Object>>) body;
            } else {
                rows = List.of((Map<String, Object>) body);
            }

            List<Procedimiento> results = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                String attentionId = (String) row.get("attention_id");
                if (attentionId == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Missing attention_id"));
                }
                String dentistId = (String) row.get("dentist_id");

                Procedimiento proc = Procedimiento.builder()
                        .clinicId(user.getClinicId())
                        .attentionId(UUID.fromString(attentionId))
                        .dentistId(dentistId != null ? UUID.fromString(dentistId) : null)
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
                        .sortOrder(row.get("sort_order") != null ? ((Number) row.get("sort_order")).intValue() : 0)
                        .build();

                proc = procedimientoRepository.save(proc);
                results.add(proc);
            }

            if (results.size() == 1) {
                return ResponseEntity.status(HttpStatus.CREATED).body(results.get(0));
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(results);
        } catch (Exception e) {
            log.error("Error creating procedimiento", e);
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
            Optional<Procedimiento> opt = procedimientoRepository.findByIdAndClinicId(id, user.getClinicId());
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Procedimiento proc = opt.get();

            if (updates.containsKey("dentist_id")) {
                String did = (String) updates.get("dentist_id");
                proc.setDentistId(did != null ? UUID.fromString(did) : null);
            }
            if (updates.containsKey("fecha_inicio_atencion")) proc.setFechaInicioAtencion((String) updates.get("fecha_inicio_atencion"));
            if (updates.containsKey("cod_procedimiento")) proc.setCodProcedimiento((String) updates.get("cod_procedimiento"));
            if (updates.containsKey("via_ingreso_servicio_salud")) proc.setViaIngresoServicioSalud((String) updates.get("via_ingreso_servicio_salud"));
            if (updates.containsKey("modalidad_grupo_servicio_tec_sal")) proc.setModalidadGrupoServicioTecSal((String) updates.get("modalidad_grupo_servicio_tec_sal"));
            if (updates.containsKey("grupo_servicios")) proc.setGrupoServicios((String) updates.get("grupo_servicios"));
            if (updates.containsKey("cod_servicio")) proc.setCodServicio((String) updates.get("cod_servicio"));
            if (updates.containsKey("finalidad_tecnologia_salud")) proc.setFinalidadTecnologiaSalud((String) updates.get("finalidad_tecnologia_salud"));
            if (updates.containsKey("codigo_principal_diagnostico")) proc.setCodigoPrincipalDiagnostico((String) updates.get("codigo_principal_diagnostico"));
            if (updates.containsKey("valor_servicio")) proc.setValorServicio((String) updates.get("valor_servicio"));
            if (updates.containsKey("concepto_recaudo")) proc.setConceptoRecaudo((String) updates.get("concepto_recaudo"));
            if (updates.containsKey("valor_pago_moderador")) proc.setValorPagoModerador((String) updates.get("valor_pago_moderador"));
            if (updates.containsKey("num_fev_pago_moderador")) proc.setNumFevPagoModerador((String) updates.get("num_fev_pago_moderador"));
            if (updates.containsKey("sort_order")) proc.setSortOrder(((Number) updates.get("sort_order")).intValue());

            proc = procedimientoRepository.save(proc);
            return ResponseEntity.ok(proc);
        } catch (Exception e) {
            log.error("Error updating procedimiento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        procedimientoRepository.deleteByIdAndClinicId(id, user.getClinicId());
        return ResponseEntity.ok(Map.of());
    }
}
