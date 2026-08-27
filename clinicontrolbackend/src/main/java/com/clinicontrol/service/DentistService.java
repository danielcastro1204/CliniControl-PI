package com.clinicontrol.service;

import com.clinicontrol.entity.Dentist;
import com.clinicontrol.repository.DentistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DentistService {

    private final DentistRepository dentistRepository;

    @Transactional(readOnly = true)
    public List<Dentist> getAllByClinic(UUID clinicId) {
        return dentistRepository.findByClinicIdOrderByLastName1AscLastName2AscFirstNameAsc(clinicId);
    }

    @Transactional(readOnly = true)
    public Optional<Dentist> getById(UUID id, UUID clinicId) {
        return dentistRepository.findByIdAndClinicId(id, clinicId);
    }

    @Transactional
    public Dentist create(UUID clinicId, Map<String, Object> body) {
        String firstName = getStr(body, "first_name");
        String lastName1 = getStr(body, "last_name_1");
        String lastName2 = getStr(body, "last_name_2");
        String identification = getStr(body, "identification");
        String codPrestador = getStr(body, "cod_prestador");
        String tipoDocumento = getStr(body, "tipo_documento");

        // Validate required fields
        List<String> missing = new ArrayList<>();
        if (isBlank(firstName)) missing.add("first_name");
        if (isBlank(lastName1)) missing.add("last_name_1");
        if (isBlank(identification)) missing.add("identification");
        if (isBlank(codPrestador)) missing.add("cod_prestador");

        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Campos obligatorios faltantes: " + String.join(", ", missing));
        }

        // Validate identification is digits only
        if (!identification.matches("\\d+")) {
            throw new IllegalArgumentException("El número de identificación solo puede contener dígitos.");
        }

        // Check for duplicate identification within clinic
        if (dentistRepository.findByClinicIdAndIdentification(clinicId, identification).isPresent()) {
            throw new IllegalArgumentException("Ya existe un odontólogo con este número de identificación.");
        }

        Dentist dentist = Dentist.builder()
                .clinicId(clinicId)
                .firstName(firstName)
                .lastName1(lastName1)
                .lastName2(lastName2)
                .identification(identification)
                .tipoDocumento(isBlank(tipoDocumento) ? "CC" : tipoDocumento)
                .codPrestador(codPrestador)
                .isActive(body.get("is_active") != null ? (Boolean) body.get("is_active") : true)
                .build();

        return dentistRepository.save(dentist);
    }

    @Transactional
    public Dentist update(UUID id, UUID clinicId, Map<String, Object> updates) {
        Dentist dentist = dentistRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Odontólogo no encontrado."));

        if (updates.containsKey("first_name")) {
            String v = (String) updates.get("first_name");
            if (isBlank(v)) throw new IllegalArgumentException("El campo 'first_name' es obligatorio.");
            dentist.setFirstName(v);
        }
        if (updates.containsKey("last_name_1")) {
            String v = (String) updates.get("last_name_1");
            if (isBlank(v)) throw new IllegalArgumentException("El campo 'last_name_1' es obligatorio.");
            dentist.setLastName1(v);
        }
        if (updates.containsKey("last_name_2")) {
            dentist.setLastName2((String) updates.get("last_name_2"));
        }
        if (updates.containsKey("identification")) {
            String newId = (String) updates.get("identification");
            if (isBlank(newId)) throw new IllegalArgumentException("El campo 'identification' es obligatorio.");
            if (!newId.matches("\\d+")) throw new IllegalArgumentException("El número de identificación solo puede contener dígitos.");
            if (!newId.equals(dentist.getIdentification())) {
                if (dentistRepository.findByClinicIdAndIdentification(clinicId, newId).isPresent()) {
                    throw new IllegalArgumentException("Ya existe un odontólogo con este número de identificación.");
                }
            }
            dentist.setIdentification(newId);
        }
        if (updates.containsKey("tipo_documento")) {
            dentist.setTipoDocumento((String) updates.get("tipo_documento"));
        }
        if (updates.containsKey("cod_prestador")) {
            String v = (String) updates.get("cod_prestador");
            if (isBlank(v)) throw new IllegalArgumentException("El campo 'cod_prestador' es obligatorio.");
            dentist.setCodPrestador(v);
        }
        if (updates.containsKey("is_active")) {
            dentist.setIsActive((Boolean) updates.get("is_active"));
        }

        return dentistRepository.save(dentist);
    }

    @Transactional
    public void delete(UUID id, UUID clinicId) {
        Dentist dentist = dentistRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Odontólogo no encontrado."));
        dentistRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private static String getStr(Map<String, Object> body, String key) {
        Object val = body.get(key);
        return val != null ? val.toString().trim() : "";
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
