package com.clinicontrol.controller;

import com.clinicontrol.entity.Attention;
import com.clinicontrol.repository.AttentionRepository;
import com.clinicontrol.security.AuthenticatedUser;
import com.clinicontrol.service.AttentionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/rest/v1/attentions")
@RequiredArgsConstructor
@Slf4j
public class AttentionController {

    private final AttentionRepository attentionRepository;
    private final AttentionService attentionService;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal AuthenticatedUser user,
                                    @RequestParam(name = "patient_id", required = false) String patientIdFilter) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }

        List<Map<String, Object>> attentions;
        if (patientIdFilter != null) {
            String pid = patientIdFilter.startsWith("eq.") ? patientIdFilter.substring(3) : patientIdFilter;
            attentions = attentionService.getByPatientHydrated(user.getClinicId(), UUID.fromString(pid));
        } else {
            attentions = attentionService.getAllHydrated(user.getClinicId());
        }
        return ResponseEntity.ok(Map.of("data", attentions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        return attentionService.getByIdHydrated(user.getClinicId(), id)
                .map(a -> ResponseEntity.ok(Map.of("data", a)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Map<String, Object> body) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Map<String, Object> result = attentionService.createFull(user.getClinicId(), body);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating attention", e);
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
            Optional<Attention> opt = attentionRepository.findByIdAndClinicId(id, user.getClinicId());
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Attention attention = opt.get();

            if (updates.containsKey("patient_id")) attention.setPatientId(UUID.fromString((String) updates.get("patient_id")));
            if (updates.containsKey("dentist_id")) {
                String did = (String) updates.get("dentist_id");
                attention.setDentistId(did != null ? UUID.fromString(did) : null);
            }
            if (updates.containsKey("cod_prestador")) attention.setCodPrestador((String) updates.get("cod_prestador"));
            if (updates.containsKey("num_documento_obligado")) attention.setNumDocumentoObligado((String) updates.get("num_documento_obligado"));
            if (updates.containsKey("consecutivo_usuario")) attention.setConsecutivoUsuario((String) updates.get("consecutivo_usuario"));
            if (updates.containsKey("fecha_inicial_atencion")) attention.setFechaInicialAtencion((String) updates.get("fecha_inicial_atencion"));
            if (updates.containsKey("num_autorizacion")) attention.setNumAutorizacion((String) updates.get("num_autorizacion"));
            if (updates.containsKey("tipo_documento_identificacion")) attention.setTipoDocumentoIdentificacion((String) updates.get("tipo_documento_identificacion"));
            if (updates.containsKey("numero_documento_identificacion")) attention.setNumeroDocumentoIdentificacion((String) updates.get("numero_documento_identificacion"));
            if (updates.containsKey("consulta_enabled")) attention.setConsultaEnabled((Boolean) updates.get("consulta_enabled"));
            if (updates.containsKey("procedimiento_enabled")) attention.setProcedimientoEnabled((Boolean) updates.get("procedimiento_enabled"));
            if (updates.containsKey("numero_factura")) attention.setNumeroFactura((String) updates.get("numero_factura"));
            if (updates.containsKey("tipo_nota")) attention.setTipoNota((String) updates.get("tipo_nota"));
            if (updates.containsKey("numero_nota")) attention.setNumeroNota((String) updates.get("numero_nota"));

            attention = attentionRepository.save(attention);
            return ResponseEntity.ok(attention);
        } catch (Exception e) {
            log.error("Error updating attention", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        attentionRepository.deleteByIdAndClinicId(id, user.getClinicId());
        return ResponseEntity.ok(Map.of());
    }
}
