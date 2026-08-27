package com.clinicontrol.service;

import com.clinicontrol.entity.Patient;
import com.clinicontrol.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;

    @Transactional(readOnly = true)
    public List<Patient> getAllByClinic(UUID clinicId) {
        return patientRepository.findByClinicIdOrderByPrimerApellidoAscSegundoApellidoAscNombresAsc(clinicId);
    }

    @Transactional(readOnly = true)
    public Optional<Patient> getById(UUID id, UUID clinicId) {
        return patientRepository.findByIdAndClinicId(id, clinicId);
    }

    @Transactional
    public Patient create(UUID clinicId, Map<String, Object> body) {
        String nombres = getStr(body, "nombres");
        String primerApellido = getStr(body, "primer_apellido");
        String segundoApellido = getStr(body, "segundo_apellido");
        String tipoDoc = getStr(body, "tipo_documento_identificacion");
        String numDoc = getStr(body, "num_documento_identificacion");
        String tipoUsuario = getStr(body, "tipo_usuario");
        String fechaNacimiento = getStr(body, "fecha_nacimiento");
        String codSexo = getStr(body, "cod_sexo");
        String codPaisResidencia = getStr(body, "cod_pais_residencia");
        String codMunicipioResidencia = getStr(body, "cod_municipio_residencia");
        String codZonaTerritorial = getStr(body, "cod_zona_territorial_residencia");
        String incapacidad = getStr(body, "incapacidad");
        String codPaisOrigen = getStr(body, "cod_pais_origen");

        // Validate required fields
        List<String> missing = new ArrayList<>();
        if (isBlank(nombres)) missing.add("nombres");
        if (isBlank(primerApellido)) missing.add("primer_apellido");
        if (isBlank(segundoApellido)) missing.add("segundo_apellido");
        if (isBlank(tipoDoc)) missing.add("tipo_documento_identificacion");
        if (isBlank(numDoc)) missing.add("num_documento_identificacion");
        if (isBlank(tipoUsuario)) missing.add("tipo_usuario");
        if (isBlank(fechaNacimiento)) missing.add("fecha_nacimiento");
        if (isBlank(codSexo)) missing.add("cod_sexo");
        if (isBlank(codPaisResidencia)) missing.add("cod_pais_residencia");
        if (isBlank(codMunicipioResidencia)) missing.add("cod_municipio_residencia");
        if (isBlank(codZonaTerritorial)) missing.add("cod_zona_territorial_residencia");
        if (isBlank(incapacidad)) missing.add("incapacidad");
        if (isBlank(codPaisOrigen)) missing.add("cod_pais_origen");

        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Campos obligatorios faltantes: " + String.join(", ", missing));
        }

        // Validate document number is digits only
        if (!numDoc.matches("\\d+")) {
            throw new IllegalArgumentException("El número de documento solo puede contener dígitos.");
        }

        // Validate fecha_nacimiento format and not future
        validateFechaNacimiento(fechaNacimiento);

        // Check for duplicate document
        if (patientRepository.findByClinicIdAndNumDocumentoIdentificacion(clinicId, numDoc).isPresent()) {
            throw new IllegalArgumentException("Ya existe un paciente con este número de documento.");
        }

        Patient patient = Patient.builder()
                .clinicId(clinicId)
                .nombres(nombres)
                .primerApellido(primerApellido)
                .segundoApellido(segundoApellido)
                .estadoTratamiento(getStrOrDefault(body, "estado_tratamiento", "en_tratamiento"))
                .tipoDocumentoIdentificacion(tipoDoc)
                .numDocumentoIdentificacion(numDoc)
                .tipoUsuario(tipoUsuario)
                .fechaNacimiento(fechaNacimiento)
                .codSexo(codSexo)
                .codPaisResidencia(codPaisResidencia)
                .codMunicipioResidencia(codMunicipioResidencia)
                .codZonaTerritorialResidencia(codZonaTerritorial)
                .incapacidad(incapacidad)
                .codPaisOrigen(codPaisOrigen)
                .build();

        return patientRepository.save(patient);
    }

    @Transactional
    public Patient update(UUID id, UUID clinicId, Map<String, Object> updates) {
        Patient patient = patientRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado."));

        if (updates.containsKey("nombres")) {
            String v = (String) updates.get("nombres");
            if (isBlank(v)) throw new IllegalArgumentException("El campo 'nombres' es obligatorio.");
            patient.setNombres(v);
        }
        if (updates.containsKey("primer_apellido")) {
            String v = (String) updates.get("primer_apellido");
            if (isBlank(v)) throw new IllegalArgumentException("El campo 'primer_apellido' es obligatorio.");
            patient.setPrimerApellido(v);
        }
        if (updates.containsKey("segundo_apellido")) {
            patient.setSegundoApellido((String) updates.get("segundo_apellido"));
        }
        if (updates.containsKey("estado_tratamiento")) {
            patient.setEstadoTratamiento((String) updates.get("estado_tratamiento"));
        }
        if (updates.containsKey("tipo_documento_identificacion")) {
            patient.setTipoDocumentoIdentificacion((String) updates.get("tipo_documento_identificacion"));
        }
        if (updates.containsKey("num_documento_identificacion")) {
            String newDoc = (String) updates.get("num_documento_identificacion");
            if (isBlank(newDoc)) throw new IllegalArgumentException("El campo 'num_documento_identificacion' es obligatorio.");
            if (!newDoc.matches("\\d+")) throw new IllegalArgumentException("El número de documento solo puede contener dígitos.");
            // Check duplicate only if changed
            if (!newDoc.equals(patient.getNumDocumentoIdentificacion())) {
                if (patientRepository.findByClinicIdAndNumDocumentoIdentificacion(clinicId, newDoc).isPresent()) {
                    throw new IllegalArgumentException("Ya existe un paciente con este número de documento.");
                }
            }
            patient.setNumDocumentoIdentificacion(newDoc);
        }
        if (updates.containsKey("tipo_usuario")) {
            patient.setTipoUsuario((String) updates.get("tipo_usuario"));
        }
        if (updates.containsKey("fecha_nacimiento")) {
            String fecha = (String) updates.get("fecha_nacimiento");
            if (!isBlank(fecha)) validateFechaNacimiento(fecha);
            patient.setFechaNacimiento(fecha);
        }
        if (updates.containsKey("cod_sexo")) {
            patient.setCodSexo((String) updates.get("cod_sexo"));
        }
        if (updates.containsKey("cod_pais_residencia")) {
            patient.setCodPaisResidencia((String) updates.get("cod_pais_residencia"));
        }
        if (updates.containsKey("cod_municipio_residencia")) {
            patient.setCodMunicipioResidencia((String) updates.get("cod_municipio_residencia"));
        }
        if (updates.containsKey("cod_zona_territorial_residencia")) {
            patient.setCodZonaTerritorialResidencia((String) updates.get("cod_zona_territorial_residencia"));
        }
        if (updates.containsKey("incapacidad")) {
            patient.setIncapacidad((String) updates.get("incapacidad"));
        }
        if (updates.containsKey("cod_pais_origen")) {
            patient.setCodPaisOrigen((String) updates.get("cod_pais_origen"));
        }

        return patientRepository.save(patient);
    }

    @Transactional
    public void delete(UUID id, UUID clinicId) {
        patientRepository.deleteByIdAndClinicId(id, clinicId);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private void validateFechaNacimiento(String fecha) {
        try {
            LocalDate parsed = LocalDate.parse(fecha);
            if (parsed.isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("La fecha de nacimiento no puede ser futura.");
            }
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Formato de fecha inválido. Use YYYY-MM-DD.");
        }
    }

    private static String getStr(Map<String, Object> body, String key) {
        Object val = body.get(key);
        return val != null ? val.toString().trim() : "";
    }

    private static String getStrOrDefault(Map<String, Object> body, String key, String defaultVal) {
        String v = getStr(body, key);
        return v.isEmpty() ? defaultVal : v;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
